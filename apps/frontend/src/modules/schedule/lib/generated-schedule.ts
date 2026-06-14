import type { ScheduleMonth } from './schedule-month';
import { isSameScheduleMonth } from './schedule-month';

export type GeneratedScheduleStatus = 'generated' | 'draft';

export type GeneratedSchedule = {
  id: string;
  year: number;
  month: number;
  createdAt: string;
  status: GeneratedScheduleStatus;
};

export const GENERATED_SCHEDULES_STORAGE_KEY = 'scheduler.generated-schedules';

export function findGeneratedSchedule(
  schedules: GeneratedSchedule[],
  month: ScheduleMonth,
): GeneratedSchedule | undefined {
  return schedules.find((entry) => isSameScheduleMonth(entry, month));
}

export function sortGeneratedSchedules(schedules: GeneratedSchedule[]): GeneratedSchedule[] {
  return [...schedules].sort((a, b) => b.year - a.year || b.month - a.month);
}

export function createMockGeneratedSchedules(): GeneratedSchedule[] {
  return [
    {
      id: 'mock-schedule-2026-05',
      year: 2026,
      month: 5,
      createdAt: '2026-05-10T09:00:00.000Z',
      status: 'generated',
    },
    {
      id: 'mock-schedule-2026-04',
      year: 2026,
      month: 4,
      createdAt: '2026-04-08T11:30:00.000Z',
      status: 'generated',
    },
  ];
}
