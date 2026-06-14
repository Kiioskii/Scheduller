import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { WorkerPodkladStatus } from '@scheduler/shared';

import { cn } from '@/lib/utils';

import type { ScheduleMonth } from '../lib/schedule-month';
import {
  defaultReceivedScheduleTableFilters,
  hasActiveReceivedScheduleFilters,
  matchesReceivedScheduleFilters,
  type ReceivedScheduleTableFilters,
} from '../lib/received-schedule-filters';
import { useReceivedDrafts } from '@/modules/drafts';
import { ReceivedSchedulesTableFilters } from './received-schedules-table-filters';
import { SubmitWorkerDraftButton } from './submit-worker-draft-button';
import { WorkerDraftsListDialog } from './worker-drafts-list-dialog';

const ROLE_LABELS: Record<WorkerPodkladStatus['role'], string> = {
  boss: 'Szef',
  worker: 'Pracownik',
};

const columnHelper = createColumnHelper<WorkerPodkladStatus>();

function receivedStatusBadge(received: boolean, draftCount: number): ReactNode {
  const hasMultipleDrafts = draftCount > 1;

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        hasMultipleDrafts
          ? 'bg-destructive/10 text-destructive'
          : received
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
      )}
    >
      {hasMultipleDrafts ? `Tak (${draftCount})` : received ? 'Tak' : 'Nie'}
    </span>
  );
}

type ReceivedSchedulesTableProps = {
  month: ScheduleMonth;
};

export function ReceivedSchedulesTable({ month }: ReceivedSchedulesTableProps) {
  const { data = [], isLoading, isError, error } = useReceivedDrafts(month);
  const [filters, setFilters] = useState<ReceivedScheduleTableFilters>(
    defaultReceivedScheduleTableFilters,
  );
  const [draftListWorker, setDraftListWorker] = useState<WorkerPodkladStatus | null>(null);

  const handleOpenDraftsList = useCallback((worker: WorkerPodkladStatus) => {
    setDraftListWorker(worker);
  }, []);

  const filteredData = useMemo(
    () => data.filter((row) => matchesReceivedScheduleFilters(row, filters)),
    [data, filters],
  );

  const filtersActive = hasActiveReceivedScheduleFilters(filters);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'fullName',
        header: 'Imię i nazwisko',
        cell: (info) => {
          const row = info.row.original;
          return `${row.firstName} ${row.lastName}`;
        },
      }),
      columnHelper.accessor('role', {
        header: 'Rola',
        cell: (info) => ROLE_LABELS[info.getValue()],
      }),
      columnHelper.accessor('received', {
        header: 'Czy przesłał podkład',
        cell: (info) => {
          const row = info.row.original;
          return receivedStatusBadge(row.received, row.draftCount);
        },
      }),
      columnHelper.display({
        id: 'submit',
        header: '',
        cell: (info) => (
          <SubmitWorkerDraftButton
            worker={info.row.original}
            month={month}
            onOpenDraftsList={handleOpenDraftsList}
          />
        ),
      }),
    ],
    [handleOpenDraftsList, month],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const emptyMessage = filtersActive
    ? 'Brak pracowników pasujących do filtrów.'
    : 'Brak pracowników do wyświetlenia.';

  return (
    <section className="space-y-4">
      <ReceivedSchedulesTableFilters filters={filters} onChange={setFilters} />

      {isLoading && <p className="text-muted-foreground">Ładowanie statusów podkładów…</p>}
      {isError && (
        <p className="text-destructive">
          Nie udało się załadować statusów podkładów.
          {error instanceof Error && error.message ? ` (${error.message})` : null}
        </p>
      )}

      {!isLoading && !isError && (
        <>
          {filtersActive && (
            <p className="text-sm text-muted-foreground">
              Wyniki: {filteredData.length} z {data.length}
            </p>
          )}

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-t',
                        row.original.deleted && 'bg-muted/30 opacity-70',
                        row.original.draftCount > 1 &&
                          'bg-destructive/5 text-destructive [&_td:not(:nth-child(3))]:text-foreground',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {draftListWorker && (
        <WorkerDraftsListDialog
          open
          worker={draftListWorker}
          month={month}
          onClose={() => setDraftListWorker(null)}
        />
      )}
    </section>
  );
}
