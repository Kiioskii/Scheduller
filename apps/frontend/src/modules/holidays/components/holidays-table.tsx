import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { Holiday } from '../api/holiday.api';
import { useHolidayMutations, useHolidays } from '../hooks/use-holidays';
import { canSetHolidayHours } from '../lib/holiday-hours';
import { AddHolidayForm } from './add-holiday-form';
import { HolidayHourSelect } from './holiday-hour-select';

const columnHelper = createColumnHelper<Holiday>();

const inputClassName =
  'h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50';

function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

function currentYear(): number {
  return new Date().getFullYear();
}

const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => currentYear() - 5 + i);

export function HolidaysTable() {
  const [year, setYear] = useState(currentYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const { data = [], isLoading, isError, error } = useHolidays(year);
  const { updateHoliday, deleteHoliday, isUpdating } = useHolidayMutations(year);

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', {
        header: 'Data',
        cell: (info) => {
          const holiday = info.row.original;
          return (
            <Input
              type="date"
              value={info.getValue()}
              disabled={isUpdating}
              onChange={(e) =>
                updateHoliday.mutate({
                  id: holiday.id,
                  date: e.target.value,
                })
              }
              className={inputClassName}
              aria-label={`Data święta ${holiday.name ?? 'bez nazwy'}`}
            />
          );
        },
      }),
      columnHelper.accessor('name', {
        header: 'Nazwa',
        cell: (info) => {
          const holiday = info.row.original;
          return (
            <Input
              type="text"
              defaultValue={info.getValue() ?? ''}
              disabled={isUpdating}
              onBlur={(e) => {
                const nextName = e.target.value.trim();
                const currentName = holiday.name ?? '';
                if (nextName !== currentName) {
                  updateHoliday.mutate({ id: holiday.id, name: nextName || null });
                }
              }}
              className={inputClassName}
              aria-label={`Nazwa święta z dnia ${formatDate(holiday.date)}`}
            />
          );
        },
      }),
      columnHelper.accessor('start', {
        header: 'Otwarcie',
        cell: (info) => {
          const holiday = info.row.original;
          return (
            <HolidayHourSelect
              value={info.getValue()}
              disabled={isUpdating}
              onChange={(nextStart) => {
                if (!canSetHolidayHours(nextStart, holiday.end)) return;
                updateHoliday.mutate({ id: holiday.id, start: nextStart });
              }}
              className={inputClassName}
              aria-label={`Godzina otwarcia — ${holiday.name ?? 'święto'}`}
            />
          );
        },
      }),
      columnHelper.accessor('end', {
        header: 'Zamknięcie',
        cell: (info) => {
          const holiday = info.row.original;
          return (
            <HolidayHourSelect
              value={info.getValue()}
              disabled={isUpdating}
              onChange={(nextEnd) => {
                if (!canSetHolidayHours(holiday.start, nextEnd)) return;
                updateHoliday.mutate({ id: holiday.id, end: nextEnd });
              }}
              className={inputClassName}
              aria-label={`Godzina zamknięcia — ${holiday.name ?? 'święto'}`}
            />
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => {
          const holiday = info.row.original;
          return (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              disabled={deleteHoliday.isPending}
              aria-label={`Usuń święto ${holiday.name} (${formatDate(holiday.date)})`}
              onClick={() => {
                if (
                  window.confirm(
                    `Usunąć święto „${holiday.name}” z dnia ${formatDate(holiday.date)}?`,
                  )
                ) {
                  deleteHoliday.mutate(holiday.id);
                }
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          );
        },
      }),
    ],
    [deleteHoliday, isUpdating, updateHoliday],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label htmlFor="holiday-year">Rok</Label>
          <select
            id="holiday-year"
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setShowAddForm(false);
            }}
            className="flex h-9 w-full max-w-[10rem] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {YEAR_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant={showAddForm ? 'secondary' : 'default'}
          onClick={() => setShowAddForm((open) => !open)}
        >
          <Plus className="size-4" />
          {showAddForm ? 'Anuluj' : 'Dodaj święto'}
        </Button>
      </div>

      {showAddForm && <AddHolidayForm year={year} onClose={() => setShowAddForm(false)} />}

      {isLoading && <p className="text-muted-foreground">Ładowanie świąt…</p>}
      {isError && (
        <p className="text-destructive">
          Nie udało się załadować listy świąt.
          {error instanceof Error && error.message ? ` (${error.message})` : null}
        </p>
      )}

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
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                    Brak świąt w roku {year}. Dodaj pierwsze przyciskiem „Dodaj święto”.
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
      )}
    </section>
  );
}
