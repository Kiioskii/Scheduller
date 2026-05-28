import { z } from 'zod';

export const scheduleEntrySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export const scheduleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  entries: z.array(scheduleEntrySchema),
});

export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;
export type Schedule = z.infer<typeof scheduleSchema>;
