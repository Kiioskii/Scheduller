import { useRef, useState } from 'react';
import { FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import type { ImportedScheduleFile } from '@scheduler/shared';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useScheduleMutations } from '../hooks/use-schedule';
import { filterScheduleExcelFiles } from '../lib/schedules-file';
import type { ScheduleMonth } from '../lib/schedule-month';
import { ImportSchedulesReviewDialog } from './import-schedules-review-dialog';

type ImportSchedulesFormProps = {
  defaultMonth: ScheduleMonth;
  onClose: () => void;
};

export function ImportSchedulesForm({ defaultMonth, onClose }: ImportSchedulesFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { parseSchedulesImport } = useScheduleMutations();
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [reviewFiles, setReviewFiles] = useState<ImportedScheduleFile[] | null>(null);

  function closeReview() {
    setReviewFiles(null);
  }

  function handleReviewSaved() {
    setReviewFiles(null);
    setSelectedNames([]);
    onClose();
  }

  function handleFileChange(fileList: FileList | null) {
    setParseErrors([]);
    setSelectedNames([]);
    setReviewFiles(null);

    if (!fileList?.length) return;

    const excelFiles = filterScheduleExcelFiles(fileList);
    const rejectedCount = fileList.length - excelFiles.length;

    if (excelFiles.length === 0) {
      setParseErrors(['Obsługiwane formaty: .xlsx, .xls']);
      return;
    }

    if (rejectedCount > 0) {
      setParseErrors([
        `Pominięto ${rejectedCount} ${rejectedCount === 1 ? 'plik' : 'pliki'} — dozwolony jest wyłącznie Excel (.xlsx, .xls).`,
      ]);
    }

    setSelectedNames(excelFiles.map((file) => file.name));

    parseSchedulesImport.mutate(excelFiles, {
      onSuccess: (files) => {
        setReviewFiles(
          files.map((file) => ({
            ...file,
            year: defaultMonth.year,
            month: defaultMonth.month,
          })),
        );
      },
      onError: (error) => {
        setParseErrors([error instanceof Error ? error.message : 'Nie udało się odczytać plików.']);
      },
      onSettled: () => {
        if (inputRef.current) inputRef.current.value = '';
      },
    });
  }

  const isParsing = parseSchedulesImport.isPending;
  const reviewOpen = reviewFiles !== null;

  return (
    <>
      <div className="relative space-y-4 rounded-lg border bg-muted/30 p-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 size-8"
          onClick={onClose}
          disabled={isParsing}
          aria-label="Zamknij import"
        >
          <X className="size-4" />
        </Button>

        <div className="pr-8">
          <p className="text-sm font-medium">Import grafików z Excela</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Wybierz jeden lub więcej plików <span className="font-medium text-foreground">.xlsx</span>{' '}
            / <span className="font-medium text-foreground">.xls</span>. Inne formaty zostaną
            pominięte.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          disabled={isParsing || reviewOpen}
          onChange={(e) => handleFileChange(e.target.files)}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isParsing || reviewOpen}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            Wybierz pliki
          </Button>
        </div>

        {selectedNames.length > 0 && (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {selectedNames.map((name) => (
              <li key={name} className="inline-flex items-center gap-2">
                <FileSpreadsheet className="size-4 shrink-0" />
                {name}
              </li>
            ))}
          </ul>
        )}

        {isParsing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" />
            Wczytywanie plików…
          </div>
        )}

        {parseErrors.length > 0 && (
          <ul className="space-y-1 text-sm text-destructive">
            {parseErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      {isParsing && (
        <div
          className={cn(
            'fixed inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-[1px]',
          )}
          aria-hidden
        >
          <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-3 shadow-sm">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <span className="text-sm font-medium">Wczytywanie plików…</span>
          </div>
        </div>
      )}

      {reviewOpen && reviewFiles && (
        <ImportSchedulesReviewDialog
          open
          files={reviewFiles}
          onClose={closeReview}
          onSaved={handleReviewSaved}
        />
      )}
    </>
  );
}
