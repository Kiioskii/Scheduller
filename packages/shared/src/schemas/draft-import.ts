import { z } from 'zod';

import { createWorkerInputSchema, workerIdSchema, workerRoleSchema } from './worker';

export const analyzedDraftSchema = z.object({
  clientId: z.string().min(1),
  fileName: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export const matchedDraftWorkerSchema = z.object({
  id: workerIdSchema,
  firstName: z.string(),
  lastName: z.string(),
  role: workerRoleSchema,
});

export const matchedDraftSchema = z.object({
  draft: analyzedDraftSchema,
  worker: matchedDraftWorkerSchema,
});

export const draftImportWorkerOptionSchema = z.object({
  id: workerIdSchema,
  firstName: z.string(),
  lastName: z.string(),
  role: workerRoleSchema,
});

export const analyzeDraftsResultSchema = z.object({
  matched: z.array(matchedDraftSchema),
  unmatched: z.array(analyzedDraftSchema),
  activeWorkers: z.array(draftImportWorkerOptionSchema),
});

export const confirmDraftImportAssignmentSchema = z.discriminatedUnion('kind', [
  z.object({
    clientId: z.string().min(1),
    kind: z.literal('existing'),
    workerId: workerIdSchema,
  }),
  z.object({
    clientId: z.string().min(1),
    kind: z.literal('new'),
    worker: createWorkerInputSchema,
  }),
]);

export const confirmDraftImportsInputSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  assignments: z.array(confirmDraftImportAssignmentSchema).min(1),
});

export const confirmDraftImportsResultSchema = z.object({
  saved: z.number().int().nonnegative(),
  workerIds: z.array(workerIdSchema),
});

export type AnalyzedDraft = z.infer<typeof analyzedDraftSchema>;
export type MatchedDraft = z.infer<typeof matchedDraftSchema>;
export type AnalyzeDraftsResult = z.infer<typeof analyzeDraftsResultSchema>;
export type ConfirmDraftImportsInput = z.infer<typeof confirmDraftImportsInputSchema>;
export type ConfirmDraftImportsResult = z.infer<typeof confirmDraftImportsResultSchema>;
export type ConfirmDraftImportAssignment = z.infer<typeof confirmDraftImportAssignmentSchema>;
