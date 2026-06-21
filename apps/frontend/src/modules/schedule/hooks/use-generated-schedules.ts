import { useCallback, useState } from 'react';
import type { GenerateScheduleResult, ScheduleDayAssignment } from '@scheduler/shared';

import { generateSchedule as generateScheduleApi } from '../api/schedule.api';
import {
  GENERATED_SCHEDULES_STORAGE_KEY,
  normalizeGeneratedSchedules,
  sortGeneratedSchedules,
  type GeneratedSchedule,
} from '../lib/generated-schedule';
import type { ScheduleMonth } from '../lib/schedule-month';

function loadGeneratedSchedules(): GeneratedSchedule[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(GENERATED_SCHEDULES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return normalizeGeneratedSchedules(JSON.parse(raw));
  } catch {
    return [];
  }
}

function persistGeneratedSchedules(schedules: GeneratedSchedule[]): void {
  window.localStorage.setItem(GENERATED_SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
}

export function useGeneratedSchedules() {
  const [schedules, setSchedules] = useState<GeneratedSchedule[]>(() => loadGeneratedSchedules());
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const generateSchedule = useCallback(
    async (
      month: ScheduleMonth,
      dayAssignments: ScheduleDayAssignment[],
    ): Promise<GenerateScheduleResult | null> => {
      setError(null);

      if (dayAssignments.length === 0) {
        setError('Przypisz co najmniej jeden dzień do szablonu zmian.');
        return null;
      }

      setIsGenerating(true);

      try {
        return await generateScheduleApi(month.year, month.month, dayAssignments);
      } catch (generateError) {
        setError(
          generateError instanceof Error
            ? generateError.message
            : 'Nie udało się wygenerować grafiku.',
        );
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  const acceptSchedule = useCallback(
    (
      result: GenerateScheduleResult,
      dayAssignments: ScheduleDayAssignment[],
    ): GeneratedSchedule => {
      setIsAccepting(true);
      try {
        const entry: GeneratedSchedule = {
          id: result.jobId,
          year: result.year,
          month: result.month,
          createdAt: new Date().toISOString(),
          status: 'generated',
          dayAssignments,
          jobId: result.jobId,
          preview: result.preview,
          solverStatus: result.solverStatus,
          assignmentCount: result.assignmentCount,
          message: result.message,
        };

        setSchedules((current) => {
          const nextSchedules = sortGeneratedSchedules([entry, ...current]);
          persistGeneratedSchedules(nextSchedules);
          return nextSchedules;
        });

        return entry;
      } finally {
        setIsAccepting(false);
      }
    },
    [],
  );

  return {
    schedules,
    generateSchedule,
    acceptSchedule,
    isGenerating,
    isAccepting,
    error,
    clearError: () => setError(null),
  };
}
