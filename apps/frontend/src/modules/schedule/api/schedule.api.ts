import { scheduleEntrySchema } from '@park/shared';
import { z } from 'zod';

export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;

export const scheduleKeys = {
  all: ['schedule'] as const,
  list: () => [...scheduleKeys.all, 'list'] as const,
};

/** Tymczasowe dane demo — zamień na fetch z API / Supabase */
export async function fetchScheduleEntries(): Promise<ScheduleEntry[]> {
  return scheduleEntrySchema.array().parse([
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Zmiana poranna',
      startAt: '2026-05-28T06:00:00.000Z',
      endAt: '2026-05-28T14:00:00.000Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Zmiana popołudniowa',
      startAt: '2026-05-28T14:00:00.000Z',
      endAt: '2026-05-28T22:00:00.000Z',
    },
  ]);
}
