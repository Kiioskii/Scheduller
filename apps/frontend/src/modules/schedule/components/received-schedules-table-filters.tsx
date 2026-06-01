import { Label } from '@/components/ui/label';

import {
  defaultReceivedScheduleTableFilters,
  type ReceivedScheduleRoleFilter,
  type ReceivedScheduleSubmittedFilter,
  type ReceivedScheduleTableFilters,
} from '../lib/received-schedule-filters';

const selectClassName =
  'flex h-9 w-full min-w-[8.5rem] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

type ReceivedSchedulesTableFiltersProps = {
  filters: ReceivedScheduleTableFilters;
  onChange: (filters: ReceivedScheduleTableFilters) => void;
};

export function ReceivedSchedulesTableFilters({
  filters,
  onChange,
}: ReceivedSchedulesTableFiltersProps) {
  function patch(partial: Partial<ReceivedScheduleTableFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/20 p-4">
      <div className="space-y-2">
        <Label htmlFor="received-filter-role">Rola</Label>
        <select
          id="received-filter-role"
          value={filters.role}
          onChange={(e) => patch({ role: e.target.value as ReceivedScheduleRoleFilter })}
          className={selectClassName}
        >
          <option value="all">Wszystkie</option>
          <option value="boss">Szef</option>
          <option value="worker">Pracownik</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="received-filter-submitted">Podkład</Label>
        <select
          id="received-filter-submitted"
          value={filters.submitted}
          onChange={(e) => patch({ submitted: e.target.value as ReceivedScheduleSubmittedFilter })}
          className={selectClassName}
        >
          <option value="all">Wszyscy</option>
          <option value="yes">Przesłali podkład</option>
          <option value="no">Nie przesłali podkładu</option>
        </select>
      </div>

      <button
        type="button"
        className="h-9 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => onChange(defaultReceivedScheduleTableFilters)}
      >
        Wyczyść filtry
      </button>
    </div>
  );
}
