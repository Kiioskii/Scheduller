import { workerPodkladStatusSchema, type WorkerPodkladStatus } from '@scheduler/shared';

import { rowToWorker, type WorkerRow } from '../workers/workers.mapper';

/** Supabase table `Received_drafts` (worker_id, year, month, recived). */
export type ReceivedScheduleRow = {
  worker_id: number | string;
  year: number;
  month: number;
  recived: number | boolean | null;
};

export function isReceivedFlag(value: ReceivedScheduleRow['recived']): boolean {
  return value === true || value === 1;
}

export function workerPodkladStatus(
  worker: WorkerRow,
  receivedByWorkerId: ReadonlyMap<string, boolean>,
): WorkerPodkladStatus {
  const mapped = rowToWorker(worker);
  return workerPodkladStatusSchema.parse({
    workerId: mapped.id,
    firstName: mapped.firstName,
    lastName: mapped.lastName,
    role: mapped.role,
    deleted: mapped.deleted,
    received: receivedByWorkerId.get(mapped.id) ?? false,
  });
}
