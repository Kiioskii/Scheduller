import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { cn } from '@/lib/utils';

import type { GeneratedSchedule } from '../lib/generated-schedule';
import { formatScheduleMonth } from '../lib/schedule-month';

const STATUS_LABELS: Record<GeneratedSchedule['status'], string> = {
  generated: 'Zaakceptowany',
  draft: 'Szkic',
  pending: 'Do akceptacji',
};

const columnHelper = createColumnHelper<GeneratedSchedule & { version: number }>();

type GeneratedSchedulesTableProps = {
  schedules: GeneratedSchedule[];
  onPreview?: (schedule: GeneratedSchedule) => void;
};

export function GeneratedSchedulesTable({ schedules, onPreview }: GeneratedSchedulesTableProps) {
  const rows = useMemo(() => {
    const sorted = [...schedules].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const versionById = new Map<string, number>();
    const ascending = [...schedules].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    ascending.forEach((entry, index) => {
      versionById.set(entry.id, index + 1);
    });

    return sorted.map((entry) => ({
      ...entry,
      version: versionById.get(entry.id) ?? 1,
    }));
  }, [schedules]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'version',
        header: 'Wersja',
        cell: (info) => <span className="font-medium">#{info.row.original.version}</span>,
      }),
      columnHelper.display({
        id: 'period',
        header: 'Miesiąc',
        cell: (info) => formatScheduleMonth(info.row.original),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Wygenerowano',
        cell: (info) => new Date(info.getValue()).toLocaleString('pl-PL'),
      }),
      columnHelper.accessor('dayAssignments', {
        header: 'Dni ze szablonem',
        cell: (info) => info.getValue().length,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          return (
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                status === 'generated'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {STATUS_LABELS[status]}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'preview',
        header: '',
        cell: (info) => {
          const schedule = info.row.original;
          if (!schedule.preview || !onPreview) return null;
          return (
            <button
              type="button"
              className="text-sm text-primary underline-offset-4 hover:underline"
              onClick={() => onPreview(schedule)}
            >
              Podgląd
            </button>
          );
        },
      }),
    ],
    [onPreview],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight">Lista grafików</h3>
        <p className="text-sm text-muted-foreground">
          Wygenerowane wersje grafiku za wybrany miesiąc. Możesz utworzyć wiele wariantów dla tego
          samego okresu.
        </p>
      </div>

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
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  Brak wygenerowanych grafików za ten miesiąc.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t">
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
    </section>
  );
}
