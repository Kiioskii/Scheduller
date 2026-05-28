import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ScheduleEntry } from '../api/schedule.api';
import { useSchedule } from '../hooks/use-schedule';

const columnHelper = createColumnHelper<ScheduleEntry>();

const columns = [
  columnHelper.accessor('title', {
    header: 'Tytuł',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('startAt', {
    header: 'Start',
    cell: (info) => new Date(info.getValue()).toLocaleString('pl-PL'),
  }),
  columnHelper.accessor('endAt', {
    header: 'Koniec',
    cell: (info) => new Date(info.getValue()).toLocaleString('pl-PL'),
  }),
];

export function ScheduleTable() {
  const { data = [], isLoading, isError } = useSchedule();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="rounded-lg border p-6">
      <h2 className="mb-2 text-lg font-medium">Przykładowy grafik</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        TanStack Table + wspólne schematy Zod z pakietem <code>@park/shared</code>.
      </p>
      {isLoading && <p className="text-muted-foreground">Ładowanie grafiku…</p>}
      {isError && <p className="text-destructive">Nie udało się załadować grafiku.</p>}
      {!isLoading && !isError && (
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
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
