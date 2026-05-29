import {
  workerSchema,
  type CreateWorkerInput,
  type UpdateWorkerInput,
  type Worker,
} from '@scheduler/shared';

export type WorkerRow = {
  id: number | string;
  first_name: string;
  last_name: string;
  role: 'boss' | 'worker';
  priority: number;
  checker: boolean;
  deleted: boolean;
};

export function rowToWorker(row: WorkerRow): Worker {
  return workerSchema.parse({
    id: String(row.id),
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    priority: row.priority,
    checker: row.checker,
    deleted: row.deleted,
  });
}

export function createInputToRow(input: CreateWorkerInput): Omit<WorkerRow, 'id'> {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    role: input.role,
    priority: input.priority,
    checker: input.checker ?? false,
    deleted: false,
  };
}

export function updateInputToRow(
  input: UpdateWorkerInput,
): Partial<Pick<WorkerRow, 'role' | 'priority' | 'checker' | 'deleted'>> {
  const row: Partial<Pick<WorkerRow, 'role' | 'priority' | 'checker' | 'deleted'>> = {};

  if (input.role !== undefined) row.role = input.role;
  if (input.priority !== undefined) row.priority = input.priority;
  if (input.checker !== undefined) row.checker = input.checker;
  if (input.deleted !== undefined) row.deleted = input.deleted;

  return row;
}
