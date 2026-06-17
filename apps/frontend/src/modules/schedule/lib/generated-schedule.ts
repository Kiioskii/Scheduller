import type { ScheduleDayAssignment } from '@scheduler/shared';

import type { ScheduleMonth } from './schedule-month';
import { isSameScheduleMonth } from './schedule-month';

export type GeneratedScheduleStatus = 'generated' | 'draft';

export type { ScheduleDayAssignment };

export type GeneratedSchedule = {
  id: string;
  year: number;
  month: number;
  createdAt: string;
  status: GeneratedScheduleStatus;
  dayAssignments: ScheduleDayAssignment[];
  jobId?: string;
};

export const GENERATED_SCHEDULES_STORAGE_KEY = 'scheduler.generated-schedules';

export function filterSchedulesByMonth(
  schedules: GeneratedSchedule[],
  month: ScheduleMonth,
): GeneratedSchedule[] {
  return schedules.filter((entry) => isSameScheduleMonth(entry, month));
}

export function sortGeneratedSchedules(schedules: GeneratedSchedule[]): GeneratedSchedule[] {
  return [...schedules].sort((a, b) => {
    const byYear = b.year - a.year;
    if (byYear !== 0) return byYear;

    const byMonth = b.month - a.month;
    if (byMonth !== 0) return byMonth;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function isLegacyMockSchedule(entry: GeneratedSchedule): boolean {
  return entry.id.startsWith('mock-schedule-');
}

export function normalizeGeneratedSchedules(schedules: unknown): GeneratedSchedule[] {
  if (!Array.isArray(schedules)) return [];

  return sortGeneratedSchedules(
    schedules
      .filter((entry): entry is GeneratedSchedule => {
        if (!entry || typeof entry !== 'object') return false;
        const candidate = entry as GeneratedSchedule;
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.year === 'number' &&
          typeof candidate.month === 'number' &&
          typeof candidate.createdAt === 'string' &&
          !isLegacyMockSchedule(candidate)
        );
      })
      .map((entry) => ({
        ...entry,
        dayAssignments: entry.dayAssignments ?? [],
      })),
  );
}
