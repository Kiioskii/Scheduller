import { z } from 'zod';

export const workerDraftFileSchema = z.object({
  id: z.string().min(1),
  fileName: z.string(),
  createdAt: z.string(),
});

export type WorkerDraftFile = z.infer<typeof workerDraftFileSchema>;

export const workerDraftFilesResultSchema = z.object({
  drafts: workerDraftFileSchema.array(),
});

export type WorkerDraftFilesResult = z.infer<typeof workerDraftFilesResultSchema>;

export const deleteWorkerDraftResultSchema = z.object({
  deletedDraftId: z.string().min(1),
  remainingDraftCount: z.number().int().nonnegative(),
});

export type DeleteWorkerDraftResult = z.infer<typeof deleteWorkerDraftResultSchema>;
