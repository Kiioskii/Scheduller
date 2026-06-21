import { z } from 'zod';

import { shiftTemplateIdSchema } from './shift-template';

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data musi być w formacie RRRR-MM-DD');

export const scheduleDayAssignmentSchema = z.object({
  date: dateStringSchema,
  shiftTemplateId: shiftTemplateIdSchema,
});

export const schedulePreviewHalfCellSchema = z.object({
  text: z.string().nullable(),
  fill: z.enum(['none', 'yellow', 'purple']),
});

export const schedulePreviewDayCellSchema = z.object({
  start: schedulePreviewHalfCellSchema,
  end: schedulePreviewHalfCellSchema,
});

export const schedulePreviewWorkerSchema = z.object({
  workerId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  rows: z.array(z.array(schedulePreviewDayCellSchema)),
});

export const schedulePreviewSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  daysInMonth: z.number().int().min(28).max(31),
  weekdays: z.array(z.string()),
  dayNumbers: z.array(z.number().int()),
  workers: z.array(schedulePreviewWorkerSchema),
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
  status: z.enum(['accepted', 'failed']),
  draftCount: z.number().int().nonnegative(),
  holidayCount: z.number().int().nonnegative(),
  assignmentCount: z.number().int().nonnegative(),
  totalSlotCount: z.number().int().nonnegative(),
  solverStatus: z.enum(['optimal', 'feasible', 'infeasible']),
  message: z.string(),
  preview: schedulePreviewSchema,
  unassignedSlotIds: z.array(z.string()),
});

export const exportGrafikPdfInputSchema = z.object({
  preview: schedulePreviewSchema,
});

export const exportGrafikPdfResultSchema = z.object({
  fileName: z.string().min(1),
  contentBase64: z.string().min(1),
});

export type ScheduleDayAssignment = z.infer<typeof scheduleDayAssignmentSchema>;
export type SchedulePreviewHalfCell = z.infer<typeof schedulePreviewHalfCellSchema>;
export type SchedulePreviewDayCell = z.infer<typeof schedulePreviewDayCellSchema>;
export type SchedulePreviewWorker = z.infer<typeof schedulePreviewWorkerSchema>;
export type SchedulePreview = z.infer<typeof schedulePreviewSchema>;
export type GenerateScheduleInput = z.infer<typeof generateScheduleInputSchema>;
export type GenerateScheduleResult = z.infer<typeof generateScheduleResultSchema>;
export type ExportGrafikPdfInput = z.infer<typeof exportGrafikPdfInputSchema>;
export type ExportGrafikPdfResult = z.infer<typeof exportGrafikPdfResultSchema>;
