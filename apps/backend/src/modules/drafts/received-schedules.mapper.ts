import { workerPodkladStatusSchema, type WorkerPodkladStatus } from '@scheduler/shared';

import { rowToWorker, type WorkerRow } from '../workers/workers.mapper';

/** Supabase table `Received_drafts` — one row per uploaded draft file. */
export type ReceivedDraftRow = {
  id: number | string;
  worker_id: number | string;
  year: number;
  month: number;
  recived: number | boolean | null;
  created_at: string;
  storage_path: string;
  file_name: string;
};

export function isReceivedFlag(value: ReceivedDraftRow['recived']): boolean {
  return value === true || value === 1;
}

export function buildWorkerDraftDownloadFileName(
  firstName: string,
  lastName: string,
  year: number,
  month: number,
  originalFileName: string,
): string {
  const lower = originalFileName.toLowerCase();
  const extension = lower.endsWith('.xlsx') ? '.xlsx' : lower.endsWith('.xls') ? '.xls' : '.xlsx';
  return `${firstName} ${lastName} podklad ${month}/${year}${extension}`;
}

export function workerPodkladStatus(
  worker: WorkerRow,
  draftCountByWorkerId: ReadonlyMap<string, number>,
): WorkerPodkladStatus {
  const mapped = rowToWorker(worker);
  const draftCount = draftCountByWorkerId.get(mapped.id) ?? 0;

  return workerPodkladStatusSchema.parse({
    workerId: mapped.id,
    firstName: mapped.firstName,
    lastName: mapped.lastName,
    role: mapped.role,
    deleted: mapped.deleted,
    received: draftCount > 0,
    draftCount,
  });
}
