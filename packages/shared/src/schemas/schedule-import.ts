import { z } from 'zod';

export const importedScheduleFileSchema = z.object({
  fileName: z.string().min(1),
  sheetName: z.string().min(1),
  sheetNames: z.array(z.string().min(1)).min(1),
  rowCount: z.number().int().nonnegative(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export const saveImportedSchedulesInputSchema = z.object({
  files: z.array(importedScheduleFileSchema).min(1),
});

export type ImportedScheduleFile = z.infer<typeof importedScheduleFileSchema>;
export type SaveImportedSchedulesInput = z.infer<typeof saveImportedSchedulesInputSchema>;
