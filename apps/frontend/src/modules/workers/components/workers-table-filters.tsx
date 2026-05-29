import { Label } from '@/components/ui/label';

import {
  defaultWorkerTableFilters,
  type WorkerCheckerFilter,
  type WorkerDeletedFilter,
  type WorkerRoleFilter,
  type WorkerTableFilters,
} from '../lib/worker-filters';

const selectClassName =
  'flex h-9 w-full min-w-[8.5rem] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

type WorkersTableFiltersProps = {
  filters: WorkerTableFilters;
  onChange: (filters: WorkerTableFilters) => void;
};

export function WorkersTableFilters({ filters, onChange }: WorkersTableFiltersProps) {
  function patch(partial: Partial<WorkerTableFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/20 p-4">
      <div className="space-y-2">
        <Label htmlFor="filter-role">Rola</Label>
        <select
          id="filter-role"
          value={filters.role}
          onChange={(e) => patch({ role: e.target.value as WorkerRoleFilter })}
          className={selectClassName}
        >
          <option value="all">Wszystkie</option>
          <option value="boss">Szef</option>
          <option value="worker">Pracownik</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-deleted">Status</Label>
        <select
          id="filter-deleted"
          value={filters.deleted}
          onChange={(e) => patch({ deleted: e.target.value as WorkerDeletedFilter })}
          className={selectClassName}
        >
          <option value="active">Aktywni</option>
          <option value="deleted">Usunięci</option>
          <option value="all">Wszyscy</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-checker">Checker</Label>
        <select
          id="filter-checker"
          value={filters.checker}
          onChange={(e) => patch({ checker: e.target.value as WorkerCheckerFilter })}
          className={selectClassName}
        >
          <option value="all">Wszyscy</option>
          <option value="yes">Tak</option>
          <option value="no">Nie</option>
        </select>
      </div>

      <button
        type="button"
        className="h-9 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => onChange(defaultWorkerTableFilters)}
      >
        Wyczyść filtry
      </button>
    </div>
  );
}
