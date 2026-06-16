import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { ShiftTemplate } from '../api/shift-template.api';
import { useShiftTemplateMutations, useShiftTemplates } from '../hooks/use-shift-templates';
import { formatRoleLabel, formatShiftHours, formatWeekdays } from '../lib/weekdays';
import { AddShiftTemplateDialog } from './add-shift-template-dialog';

const columnHelper = createColumnHelper<ShiftTemplate>();

export function ShiftTemplatesTable() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data = [], isLoading, isError, error } = useShiftTemplates();
  const { deleteShiftTemplate } = useShiftTemplateMutations();

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Nazwa szablonu',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('shifts', {
        header: 'Zmiany',
        cell: (info) => {
          const shifts = info.getValue();
          return (
            <ul className="space-y-2 text-sm">
              {shifts.map((shift, index) => (
                <li
                  key={`${info.row.original.id}-${index}`}
                  className="rounded-md border bg-muted/20 px-3 py-2"
                >
                  <span className="font-medium">{formatRoleLabel(shift.role)}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {shift.requiredWorkers}{' '}
                    {shift.requiredWorkers === 1 ? 'osoba' : 'osób'} ·{' '}
                    {formatShiftHours(shift.start, shift.end)} · {formatWeekdays(shift.weekdays)}
                  </span>
                </li>
              ))}
            </ul>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => {
          const template = info.row.original;
          return (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              disabled={deleteShiftTemplate.isPending}
              aria-label={`Usuń szablon ${template.name}`}
              onClick={() => {
                if (window.confirm(`Usunąć szablon „${template.name}”?`)) {
                  deleteShiftTemplate.mutate(template.id);
                }
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          );
        },
      }),
    ],
    [deleteShiftTemplate],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowAddDialog(true)}>
          <Plus className="size-4" />
          Dodaj szablon
        </Button>
      </div>

      <AddShiftTemplateDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} />

      {isLoading && <p className="text-muted-foreground">Ładowanie szablonów zmian…</p>}
      {isError && (
        <p className="text-destructive">
          Nie udało się załadować szablonów.
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
                    Brak szablonów zmian. Dodaj pierwszy przyciskiem „Dodaj szablon”.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t align-top">
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
