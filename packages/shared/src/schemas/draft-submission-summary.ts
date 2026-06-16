import { z } from 'zod';

export const draftSubmissionSummarySchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  activeWorkers: z.number().int().nonnegative(),
  submittedCount: z.number().int().nonnegative(),
});

export type DraftSubmissionSummary = z.infer<typeof draftSubmissionSummarySchema>;
