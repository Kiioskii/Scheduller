import { z } from 'zod';

export const workerRoleSchema = z.enum(['boss', 'worker']);
export const workerPrioritySchema = z.number().int().min(1).max(10);

/** Supabase workers.id is bigint — exposed in API as string */
export const workerIdSchema = z.coerce.string().min(1);

export const workerSchema = z.object({
  id: workerIdSchema,
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: workerRoleSchema,
  priority: workerPrioritySchema,
  checker: z.boolean(),
  availableAsWorker: z.boolean(),
  deleted: z.boolean(),
});

export const createWorkerInputSchema = workerSchema
  .omit({ id: true, checker: true, availableAsWorker: true, deleted: true })
  .extend({
    checker: z.boolean().optional(),
    availableAsWorker: z.boolean().optional(),
  });

export const updateWorkerInputSchema = z
  .object({
    role: workerRoleSchema.optional(),
    priority: workerPrioritySchema.optional(),
    checker: z.boolean().optional(),
    availableAsWorker: z.boolean().optional(),
    deleted: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

export type Worker = z.infer<typeof workerSchema>;
export type CreateWorkerInput = z.infer<typeof createWorkerInputSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerInputSchema>;
