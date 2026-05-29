import type { Worker } from '@scheduler/shared';

export type WorkerRoleFilter = 'all' | Worker['role'];
export type WorkerDeletedFilter = 'all' | 'active' | 'deleted';
export type WorkerCheckerFilter = 'all' | 'yes' | 'no';

export type WorkerTableFilters = {
  role: WorkerRoleFilter;
  deleted: WorkerDeletedFilter;
  checker: WorkerCheckerFilter;
};

export const defaultWorkerTableFilters: WorkerTableFilters = {
  role: 'all',
  deleted: 'active',
  checker: 'all',
};

export function matchesWorkerFilters(worker: Worker, filters: WorkerTableFilters): boolean {
  if (filters.role !== 'all' && worker.role !== filters.role) return false;

  if (filters.deleted === 'active' && worker.deleted) return false;
  if (filters.deleted === 'deleted' && !worker.deleted) return false;

  if (filters.checker === 'yes' && !worker.checker) return false;
  if (filters.checker === 'no' && !worker.checker) return false;

  return true;
}

export function hasActiveWorkerFilters(filters: WorkerTableFilters): boolean {
  return (
    filters.role !== defaultWorkerTableFilters.role ||
    filters.deleted !== defaultWorkerTableFilters.deleted ||
    filters.checker !== defaultWorkerTableFilters.checker
  );
}
