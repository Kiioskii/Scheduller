import { z } from 'zod';

import { workerIdSchema, workerRoleSchema } from './worker';

export const workerPodkladStatusSchema = z.object({
  workerId: workerIdSchema,
  firstName: z.string(),
  lastName: z.string(),
  role: workerRoleSchema,
  deleted: z.boolean(),
  received: z.boolean(),
  draftCount: z.number().int().nonnegative(),
});

export type WorkerPodkladStatus = z.infer<typeof workerPodkladStatusSchema>;
