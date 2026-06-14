import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import type { AnalyzeDraftsResult } from '@scheduler/shared';

import { Button } from '@/components/ui/button';

import { useDraftImportMutations } from '@/modules/drafts/hooks/use-draft-import';
import { filterScheduleExcelFiles } from '../lib/schedules-file';
import type { ScheduleMonth } from '../lib/schedule-month';
import { ImportDraftsReviewDialog } from './import-drafts-review-dialog';

export type DraftImportSession = {
  analysis: AnalyzeDraftsResult;
  filesByClientId: Map<string, File>;
};

type ImportDraftsFormProps = {
  defaultMonth: ScheduleMonth;
  onClose: () => void;
};

export function ImportDraftsForm({ defaultMonth, onClose }: ImportDraftsFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { analyzeDrafts } = useDraftImportMutations(defaultMonth);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [reviewSession, setReviewSession] = useState<DraftImportSession | null>(null);

  function closeReview() {
    setReviewSession(null);
  }

  function handleReviewSaved() {
    setReviewSession(null);
    setSelectedNames([]);
    onClose();
  }

  function handleFileChange(fileList: FileList | null) {
    setParseErrors([]);
    setSelectedNames([]);
    setReviewSession(null);

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

    analyzeDrafts.mutate(excelFiles, {
      onSuccess: (analysis) => {
        const filesByClientId = new Map<string, File>();
        excelFiles.forEach((file, index) => {
          filesByClientId.set(String(index), file);
        });
        setReviewSession({ analysis, filesByClientId });
      },
      onError: (error) => {
        setParseErrors([
          error instanceof Error ? error.message : 'Nie udało się przeanalizować podkładów.',
        ]);
      },
      onSettled: () => {
        if (inputRef.current) inputRef.current.value = '';
      },
    });
  }

  const isAnalyzing = analyzeDrafts.isPending;
  const reviewOpen = reviewSession !== null;

  return (
    <>
      <div className="relative space-y-4 rounded-lg border bg-muted/30 p-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 size-8"
          onClick={onClose}
          disabled={isAnalyzing}
          aria-label="Zamknij import"
        >
          <X className="size-4" />
        </Button>

        <div className="pr-8">
          <p className="text-sm font-medium">Import podkładów z Excela</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Wybierz pliki podkładów (.xlsx / .xls). Pliki zostaną przeanalizowane i dopasowane do
            pracowników — zapis nastąpi dopiero po potwierdzeniu.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          disabled={isAnalyzing || reviewOpen}
          onChange={(e) => handleFileChange(e.target.files)}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isAnalyzing || reviewOpen}
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

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" />
            Analizowanie podkładów…
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

      {isAnalyzing &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-background px-6 py-5 shadow-lg">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Analizowanie podkładów…</p>
              <p className="max-w-xs text-center text-xs text-muted-foreground">
                Dopasowujemy pliki do pracowników. To może chwilę potrwać.
              </p>
            </div>
          </div>,
          document.body,
        )}

      {reviewOpen && reviewSession && (
        <ImportDraftsReviewDialog
          open
          month={defaultMonth}
          session={reviewSession}
          onClose={closeReview}
          onSaved={handleReviewSaved}
        />
      )}
    </>
  );
}
