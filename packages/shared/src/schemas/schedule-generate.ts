import { z } from 'zod';

import { shiftTemplateIdSchema } from './shift-template';

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data musi być w formacie RRRR-MM-DD');

export const scheduleDayAssignmentSchema = z.object({
  date: dateStringSchema,
  shiftTemplateId: shiftTemplateIdSchema,
});

export const generateScheduleInputSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  dayAssignments: z.array(scheduleDayAssignmentSchema).min(1),
});

export const generateScheduleResultSchema = z.object({
  jobId: z.string().min(1),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  status: z.enum(['accepted']),
  draftCount: z.number().int().nonnegative(),
  holidayCount: z.number().int().nonnegative(),
});

export type ScheduleDayAssignment = z.infer<typeof scheduleDayAssignmentSchema>;
export type GenerateScheduleInput = z.infer<typeof generateScheduleInputSchema>;
export type GenerateScheduleResult = z.infer<typeof generateScheduleResultSchema>;
