import { z } from 'zod';

import { workerIdSchema } from './worker';

export const submitWorkerDraftResultSchema = z.object({
  workerId: workerIdSchema,
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  received: z.literal(true),
});

export type SubmitWorkerDraftResult = z.infer<typeof submitWorkerDraftResultSchema>;
