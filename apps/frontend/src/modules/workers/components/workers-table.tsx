import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Check, Plus, RotateCcw, Search, Trash2, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { Worker } from '../api/worker.api';
import { useWorkerMutations, useWorkers } from '../hooks/use-workers';
import {
  defaultWorkerTableFilters,
  hasActiveWorkerFilters,
  matchesWorkerFilters,
  type WorkerTableFilters,
} from '../lib/worker-filters';
import { AddWorkerForm } from './add-worker-form';
import { ImportWorkersForm } from './import-workers-form';
import { WorkersTableFilters } from './workers-table-filters';

const PRIORITY_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const ROLE_OPTIONS = [
  { value: 'boss', label: 'Szef' },
  { value: 'worker', label: 'Pracownik' },
] as const;

const columnHelper = createColumnHelper<Worker>();

const cellSelectClassName =
  'h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50';

function matchesSearch(worker: Worker, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const firstName = worker.firstName.toLowerCase();
  const lastName = worker.lastName.toLowerCase();
  const fullName = `${firstName} ${lastName}`;

  return (
    firstName.includes(normalized) ||
    lastName.includes(normalized) ||
    fullName.includes(normalized)
  );
}

export function WorkersTable() {
  const { data = [], isLoading, isError } = useWorkers();
  const { updateWorker, updatePriority, deleteWorker, restoreWorker, isUpdating } =
    useWorkerMutations();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<WorkerTableFilters>(defaultWorkerTableFilters);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);

  const filteredData = useMemo(
    () => data.filter((worker) => matchesSearch(worker, search) && matchesWorkerFilters(worker, filters)),
    [data, search, filters],
  );

  const isSearching = search.trim().length > 0;
  const filtersActive = hasActiveWorkerFilters(filters) || isSearching;

  function openAddForm() {
    setShowImportForm(false);
    setShowAddForm(true);
  }

  function openImportForm() {
    setShowAddForm(false);
    setShowImportForm(true);
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('firstName', {
        header: 'Imię',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('lastName', {
        header: 'Nazwisko',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('role', {
        header: 'Rola',
        cell: (info) => {
          const worker = info.row.original;
          return (
            <select
              value={info.getValue()}
              disabled={isUpdating || worker.deleted}
              onChange={(e) =>
                updateWorker.mutate({
                  id: worker.id,
                  role: e.target.value as Worker['role'],
                })
              }
              className={cellSelectClassName}
              aria-label={`Rola dla ${worker.firstName} ${worker.lastName}`}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        },
      }),
      columnHelper.accessor('priority', {
        header: 'Priorytet',
        cell: (info) => {
          const worker = info.row.original;
          return (
            <select
              value={info.getValue()}
              disabled={isUpdating || worker.deleted}
              onChange={(e) =>
                updatePriority.mutate({ id: worker.id, priority: Number(e.target.value) })
              }
              className={cellSelectClassName}
              aria-label={`Priorytet dla ${worker.firstName} ${worker.lastName}`}
            >
              {PRIORITY_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          );
        },
      }),
      columnHelper.accessor('checker', {
        header: 'Checker',
        cell: (info) => {
          const worker = info.row.original;
          const checked = info.getValue();
          return (
            <Button
              type="button"
              variant={checked ? 'default' : 'outline'}
              size="sm"
              disabled={isUpdating || worker.deleted}
              aria-pressed={checked}
              aria-label={`Checker dla ${worker.firstName} ${worker.lastName}: ${checked ? 'włączony' : 'wyłączony'}`}
              onClick={() => updateWorker.mutate({ id: worker.id, checker: !checked })}
              className="min-w-[4.5rem] gap-1.5"
            >
              {checked ? (
                <>
                  <Check className="size-3.5" />
                  Tak
                </>
              ) : (
                <>
                  <X className="size-3.5" />
                  Nie
                </>
              )}
            </Button>
          );
        },
      }),
      columnHelper.accessor('deleted', {
        header: 'Status',
        cell: (info) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
              info.getValue()
                ? 'bg-destructive/10 text-destructive'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
            )}
          >
            {info.getValue() ? 'Usunięty' : 'Aktywny'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => {
          const worker = info.row.original;
          if (worker.deleted) {
            return (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={restoreWorker.isPending}
                aria-label={`Przywróć ${worker.firstName} ${worker.lastName}`}
                onClick={() => restoreWorker.mutate(worker.id)}
              >
                <RotateCcw className="size-4" />
              </Button>
            );
          }

          return (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              disabled={deleteWorker.isPending}
              aria-label={`Usuń ${worker.firstName} ${worker.lastName}`}
              onClick={() => {
                if (window.confirm(`Usunąć pracownika ${worker.firstName} ${worker.lastName}?`)) {
                  deleteWorker.mutate(worker.id);
                }
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          );
        },
      }),
    ],
    [deleteWorker, isUpdating, restoreWorker, updatePriority, updateWorker],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const emptyMessage = filtersActive
    ? 'Brak pracowników pasujących do wyszukiwania lub filtrów.'
    : 'Brak pracowników. Dodaj pierwszego przyciskiem „Dodaj pracownika”.';

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po imieniu lub nazwisku…"
            className="pl-9"
            aria-label="Szukaj pracowników"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={showAddForm ? 'secondary' : 'default'}
            onClick={() => (showAddForm ? setShowAddForm(false) : openAddForm())}
          >
            <Plus className="size-4" />
            {showAddForm ? 'Anuluj' : 'Dodaj pracownika'}
          </Button>
          <Button
            type="button"
            variant={showImportForm ? 'secondary' : 'outline'}
            onClick={() => (showImportForm ? setShowImportForm(false) : openImportForm())}
          >
            <Upload className="size-4" />
            {showImportForm ? 'Anuluj import' : 'Importuj z pliku'}
          </Button>
        </div>
      </div>

      <WorkersTableFilters filters={filters} onChange={setFilters} />

      {showAddForm && <AddWorkerForm onClose={() => setShowAddForm(false)} />}
      {showImportForm && <ImportWorkersForm onClose={() => setShowImportForm(false)} />}

      {isLoading && <p className="text-muted-foreground">Ładowanie pracowników…</p>}
      {isError && <p className="text-destructive">Nie udało się załadować listy pracowników.</p>}

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
                      className={cn('border-t', row.original.deleted && 'bg-muted/30 opacity-70')}
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
    </section>
  );
}
