import { useCallback, useState } from 'react';

import {
  createMockGeneratedSchedules,
  findGeneratedSchedule,
  GENERATED_SCHEDULES_STORAGE_KEY,
  sortGeneratedSchedules,
  type GeneratedSchedule,
} from '../lib/generated-schedule';
import type { ScheduleMonth } from '../lib/schedule-month';

function loadGeneratedSchedules(): GeneratedSchedule[] {
  if (typeof window === 'undefined') {
    return createMockGeneratedSchedules();
  }

  const raw = window.localStorage.getItem(GENERATED_SCHEDULES_STORAGE_KEY);
  if (!raw) {
    const initial = createMockGeneratedSchedules();
    window.localStorage.setItem(GENERATED_SCHEDULES_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as GeneratedSchedule[];
    return sortGeneratedSchedules(Array.isArray(parsed) ? parsed : createMockGeneratedSchedules());
  } catch {
    return createMockGeneratedSchedules();
  }
}

function persistGeneratedSchedules(schedules: GeneratedSchedule[]): void {
  window.localStorage.setItem(GENERATED_SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
}

export function useGeneratedSchedules() {
  const [schedules, setSchedules] = useState<GeneratedSchedule[]>(() => loadGeneratedSchedules());
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSchedule = useCallback((month: ScheduleMonth) => {
    setError(null);

    if (findGeneratedSchedule(schedules, month)) {
      setError(`Grafik na ${month.month}/${month.year} został już wygenerowany.`);
      return false;
    }

    setIsGenerating(true);

    const entry: GeneratedSchedule = {
      id: crypto.randomUUID(),
      year: month.year,
      month: month.month,
      createdAt: new Date().toISOString(),
      status: 'generated',
    };

    const nextSchedules = sortGeneratedSchedules([entry, ...schedules]);
    setSchedules(nextSchedules);
    persistGeneratedSchedules(nextSchedules);
    setIsGenerating(false);
    return true;
  }, [schedules]);

  return {
    schedules,
    generateSchedule,
    isGenerating,
    error,
    clearError: () => setError(null),
  };
}
