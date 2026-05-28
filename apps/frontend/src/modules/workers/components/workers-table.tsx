import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Search, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { Worker } from '../api/worker.api';
import { useWorkerMutations, useWorkers } from '../hooks/use-workers';
import { AddWorkerForm } from './add-worker-form';
import { ImportWorkersForm } from './import-workers-form';

const PRIORITY_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const columnHelper = createColumnHelper<Worker>();

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
  const { updatePriority, deleteWorker } = useWorkerMutations();
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);

  const filteredData = useMemo(
    () => data.filter((worker) => matchesSearch(worker, search)),
    [data, search],
  );

  const isSearching = search.trim().length > 0;

  function openAddForm() {
    setShowImportForm(false);
    setShowAddForm(true);
  }

  function openImportForm() {
    setShowAddForm(false);
    setShowImportForm(true);
  }

  const columns = [
    columnHelper.accessor('firstName', {
      header: 'Imię',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('lastName', {
      header: 'Nazwisko',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('priority', {
      header: 'Priorytet',
      cell: (info) => {
        const worker = info.row.original;
        return (
          <select
            value={info.getValue()}
            disabled={updatePriority.isPending}
            onChange={(e) =>
              updatePriority.mutate({ id: worker.id, priority: Number(e.target.value) })
            }
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => {
        const worker = info.row.original;
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
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const emptyMessage = isSearching
    ? 'Brak wyników dla podanego wyszukiwania.'
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

      {showAddForm && <AddWorkerForm onClose={() => setShowAddForm(false)} />}
      {showImportForm && <ImportWorkersForm onClose={() => setShowImportForm(false)} />}

      {isLoading && <p className="text-muted-foreground">Ładowanie pracowników…</p>}
      {isError && <p className="text-destructive">Nie udało się załadować listy pracowników.</p>}

      {!isLoading && !isError && (
        <>
          {isSearching && (
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
        </>
      )}
    </section>
  );
}
