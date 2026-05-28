import { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useWorkerMutations } from '../hooks/use-workers';
import { isWorkersFileAccepted, parseWorkersFile } from '../lib/parse-workers-file';

type ImportWorkersFormProps = {
  onClose: () => void;
};

export function ImportWorkersForm({ onClose }: ImportWorkersFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { createWorkersBulk } = useWorkerMutations();
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);

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

      <div className="pr-8">
        <p className="text-sm font-medium">Import z pliku</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Wgraj plik CSV lub Excel (.xlsx, .xls) z kolumnami:{' '}
          <span className="font-medium text-foreground">Imię</span>,{' '}
          <span className="font-medium text-foreground">Nazwisko</span>, opcjonalnie{' '}
          <span className="font-medium text-foreground">Priorytet</span> (1–10, domyślnie 5).
        </p>
      </div>

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
