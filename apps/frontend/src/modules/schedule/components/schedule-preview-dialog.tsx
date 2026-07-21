import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Download, Loader2, X } from 'lucide-react';
import type { GenerateScheduleResult, SchedulePreview } from '@scheduler/shared';

import { Button } from '@/components/ui/button';

import { exportGrafikPdf } from '../api/schedule.api';
import { SchedulePreviewTable } from './schedule-preview-table';

type PendingSchedulePreview = {
  result: GenerateScheduleResult;
  preview: SchedulePreview;
};

type SchedulePreviewDialogProps = {
  open: boolean;
  pending: PendingSchedulePreview | null;
  isAccepting: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onAccept: (pending: PendingSchedulePreview) => void;
};

function downloadBase64Pdf(fileName: string, contentBase64: string) {
  const binary = atob(contentBase64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function SchedulePreviewDialog({
  open,
  pending,
  isAccepting,
  readOnly = false,
  onClose,
  onAccept,
}: SchedulePreviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setExportError(null);
      setIsExporting(false);
    }
  }, [open]);

  if (!open || !pending || typeof document === 'undefined') {
    return null;
  }

  const { result, preview } = pending;
  const generationFailed = result.status === 'failed' || result.solverStatus === 'infeasible';

  async function handleDownload() {
    setExportError(null);
    setIsExporting(true);
    try {
      const exported = await exportGrafikPdf(preview);
      downloadBase64Pdf(exported.fileName, exported.contentBase64);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Nie udało się pobrać PDF.');
    } finally {
      setIsExporting(false);
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="z-70 m-auto flex max-h-[min(94vh,56rem)] w-[calc(100%-1rem)] max-w-[96rem] flex-col rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Podgląd grafiku</h2>
            <p className="text-sm text-muted-foreground">
              Sprawdź przypisane zmiany i dostępności z podkładów przed akceptacją lub pobraniem
              PDF.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Zamknij
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              Przypisania: <strong>{result.assignmentCount}</strong>
              {' / '}
              {result.totalSlotCount}
            </span>
            <span>
              Solver: <strong>{result.solverStatus}</strong>
            </span>
            <span>
              Podkłady: <strong>{result.draftCount}</strong>
            </span>
            <span>
              Pracownicy w podglądzie: <strong>{preview.workers.length}</strong>
            </span>
          </div>

          {generationFailed && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Nie udało się obsadzić wszystkich slotów ({result.unassignedSlotIds.length} z{' '}
              {result.totalSlotCount} bez przypisania). Solver dostał tylko {result.draftCount}{' '}
              podkład(ów) — upewnij się, że pozostali pracownicy przesłali podkłady z dostępnością,
              albo zmniejsz liczbę przypisanych dni / wymaganych osób w szablonie zmian.
            </p>
          )}

          <SchedulePreviewTable preview={preview} compact />

          {exportError && <p className="text-sm text-destructive">{exportError}</p>}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="size-4" />
            {readOnly ? 'Zamknij' : 'Odrzuć'}
          </Button>
          <Button type="button" variant="secondary" disabled={isExporting} onClick={handleDownload}>
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Pobierz PDF
          </Button>
          {!readOnly && (
            <Button
              type="button"
              disabled={isAccepting || generationFailed}
              onClick={() => onAccept(pending)}
            >
              {isAccepting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Zaakceptuj grafik
            </Button>
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

export type { PendingSchedulePreview };
