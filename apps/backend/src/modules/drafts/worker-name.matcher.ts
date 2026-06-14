import type { Worker } from '@scheduler/shared';

export function normalizePersonName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

export function workerNamesMatch(
  draft: { firstName: string; lastName: string },
  worker: Pick<Worker, 'firstName' | 'lastName'>,
): boolean {
  return (
    normalizePersonName(draft.firstName) === normalizePersonName(worker.firstName) &&
    normalizePersonName(draft.lastName) === normalizePersonName(worker.lastName)
  );
}

export function findWorkerByDraftName<T extends Pick<Worker, 'id' | 'firstName' | 'lastName'>>(
  draft: { firstName: string; lastName: string },
  workers: T[],
): T | undefined {
  return workers.find((worker) => workerNamesMatch(draft, worker));
}
