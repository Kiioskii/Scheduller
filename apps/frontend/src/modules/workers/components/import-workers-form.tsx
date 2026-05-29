import { useRef, useState } from 'react';
import { CircleHelp, FileSpreadsheet, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useWorkerMutations } from '../hooks/use-workers';
import { isWorkersFileAccepted, parseWorkersFile } from '../lib/parse-workers-file';

type ImportWorkersFormProps = {
  onClose: () => void;
};

export function ImportWorkersForm({ onClose }: ImportWorkersFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const instructionsRef = useRef<HTMLDialogElement>(null);
  const { createWorkersBulk } = useWorkerMutations();
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  function openInstructions() {
    instructionsRef.current?.showModal();
  }

  function closeInstructions() {
    instructionsRef.current?.close();
  }

  async function handleFileChange(file: File | null) {
    setParseErrors([]);
    setFileName(null);

    if (!file) return;

    if (!isWorkersFileAccepted(file)) {
      setParseErrors(['Obsługiwane formaty: .csv, .xlsx, .xls']);
      return;
    }

    setFileName(file.name);
    setIsParsing(true);

    try {
      const { workers, errors } = await parseWorkersFile(file);
      setParseErrors(errors);

      if (workers.length === 0) return;

      createWorkersBulk.mutate(workers, {
        onSuccess: () => {
          onClose();
        },
      });
    } catch {
      setParseErrors(['Nie udało się odczytać pliku. Sprawdź format i spróbuj ponownie.']);
    } finally {
      setIsParsing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const isBusy = isParsing || createWorkersBulk.isPending;

  return (
    <div className="relative space-y-4 rounded-lg border bg-muted/30 p-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 size-8"
        onClick={onClose}
        aria-label="Zamknij import"
      >
        <X className="size-4" />
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-2 pr-8">
        <div>
          <p className="text-sm font-medium">Import z pliku</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Wgraj plik CSV lub Excel (.xlsx, .xls) z kolumnami:{' '}
            <span className="font-medium text-foreground">Imię</span>,{' '}
            <span className="font-medium text-foreground">Nazwisko</span>, opcjonalnie{' '}
            <span className="font-medium text-foreground">Priorytet</span> (1–10, domyślnie 5).
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={openInstructions}>
          <CircleHelp className="size-4" />
          Instrukcja
        </Button>
      </div>

      <dialog
        ref={instructionsRef}
        className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/50"
        onCancel={closeInstructions}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold">Instrukcja importu</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={closeInstructions}
              aria-label="Zamknij instrukcję"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <p>
              Aby dodać pracowników z pliku, przygotuj arkusz z{' '}
              <span className="font-medium text-foreground">dwoma kolumnami</span> w pierwszym
              wierszu (nagłówki):
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-foreground">
              <li>
                pierwsza kolumna: <span className="font-medium">Imię</span>
              </li>
              <li>
                druga kolumna: <span className="font-medium">Nazwisko</span>
              </li>
            </ol>
            <p>
              Każdy kolejny wiersz to jeden pracownik. Opcjonalnie możesz dodać trzecią kolumnę{' '}
              <span className="font-medium text-foreground">Priorytet</span> (liczba 1–10).
            </p>

            <div>
              <p className="font-medium text-foreground">Jak wyeksportować plik CSV</p>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                  <span className="font-medium text-foreground">Microsoft Excel:</span> Plik →
                  Zapisz jako → wybierz format{' '}
                  <span className="text-foreground">CSV UTF-8 (rozdzielany przecinkami)</span>.
                </li>
                <li>
                  <span className="font-medium text-foreground">Google Arkusze:</span> Plik →
                  Pobierz →{' '}
                  <span className="text-foreground">Wartości rozdzielane przecinkami (.csv)</span>.
                </li>
                <li>
                  <span className="font-medium text-foreground">LibreOffice Calc:</span> Plik →
                  Zapisz jako → typ pliku{' '}
                  <span className="text-foreground">Tekst CSV (.csv)</span>.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={closeInstructions}>
              Rozumiem
            </Button>
          </div>
        </div>
      </dialog>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        disabled={isBusy}
        onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          {isBusy ? 'Przetwarzanie…' : 'Wybierz plik'}
        </Button>
        {fileName && (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="size-4 shrink-0" />
            {fileName}
          </span>
        )}
      </div>

      {parseErrors.length > 0 && (
        <ul className="space-y-1 text-sm text-destructive">
          {parseErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {createWorkersBulk.isError && (
        <p className="text-sm text-destructive">Nie udało się zapisać pracowników z pliku.</p>
      )}

      {createWorkersBulk.isSuccess && (
        <p className="text-sm text-muted-foreground">Pracownicy zostali dodani.</p>
      )}
    </div>
  );
}
