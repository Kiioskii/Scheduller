import { z } from 'zod';

export const workerPrioritySchema = z.number().int().min(1).max(10);

export const workerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  priority: workerPrioritySchema,
});

export const createWorkerInputSchema = workerSchema.omit({ id: true });

export type Worker = z.infer<typeof workerSchema>;
export type CreateWorkerInput = z.infer<typeof createWorkerInputSchema>;
