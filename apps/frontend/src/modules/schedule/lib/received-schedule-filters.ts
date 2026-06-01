import type { WorkerPodkladStatus, Worker } from '@scheduler/shared';

export type ReceivedScheduleRoleFilter = 'all' | Worker['role'];
export type ReceivedScheduleSubmittedFilter = 'all' | 'yes' | 'no';

export type ReceivedScheduleTableFilters = {
  role: ReceivedScheduleRoleFilter;
  submitted: ReceivedScheduleSubmittedFilter;
};

export const defaultReceivedScheduleTableFilters: ReceivedScheduleTableFilters = {
  role: 'all',
  submitted: 'all',
};

export function matchesReceivedScheduleFilters(
  row: WorkerPodkladStatus,
  filters: ReceivedScheduleTableFilters,
): boolean {
  if (filters.role !== 'all' && row.role !== filters.role) return false;

  if (filters.submitted === 'yes' && !row.received) return false;
  if (filters.submitted === 'no') {
    if (row.deleted) return false;
    if (row.received) return false;
  }

  return true;
}

export function hasActiveReceivedScheduleFilters(filters: ReceivedScheduleTableFilters): boolean {
  return (
    filters.role !== defaultReceivedScheduleTableFilters.role ||
    filters.submitted !== defaultReceivedScheduleTableFilters.submitted
  );
}
