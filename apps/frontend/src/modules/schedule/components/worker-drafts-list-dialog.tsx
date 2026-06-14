import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, Trash2 } from 'lucide-react';
import type { WorkerPodkladStatus } from '@scheduler/shared';

import { Button } from '@/components/ui/button';

import type { ScheduleMonth } from '../lib/schedule-month';
import {
  useDeleteWorkerDraft,
  useDownloadWorkerDraft,
  useWorkerDraftFiles,
} from '@/modules/drafts/hooks/use-received-drafts';

type WorkerDraftsListDialogProps = {
  open: boolean;
  worker: WorkerPodkladStatus;
  month: ScheduleMonth;
  onClose: () => void;
};

function formatDraftDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return '—';
  }
  return date.toLocaleString('pl-PL');
}

export function WorkerDraftsListDialog({
  open,
  worker,
  month,
  onClose,
}: WorkerDraftsListDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [downloadingDraftId, setDownloadingDraftId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useWorkerDraftFiles(
    month,
    worker.workerId,
    open,
  );
  const downloadDraft = useDownloadWorkerDraft(month);
  const deleteDraft = useDeleteWorkerDraft(month);

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
      setLocalError(null);
      setDeletingDraftId(null);
      setDownloadingDraftId(null);
    }
  }, [open]);

  function handleDownload(draftId: string) {
    setLocalError(null);
    setDownloadingDraftId(draftId);
    downloadDraft.mutate(
      { workerId: worker.workerId, draftId },
      {
        onError: (downloadError) => {
          setLocalError(
            downloadError instanceof Error
              ? downloadError.message
              : 'Nie udało się pobrać podkładu',
          );
        },
        onSettled: () => {
          setDownloadingDraftId(null);
        },
      },
    );
  }

  function handleDelete(draftId: string, fileName: string) {
    const confirmed = window.confirm(`Usunąć podkład „${fileName}”?`);
    if (!confirmed) return;

    setLocalError(null);
    setDeletingDraftId(draftId);
    deleteDraft.mutate(
      { workerId: worker.workerId, draftId },
      {
        onSuccess: (result) => {
          if (result.remainingDraftCount === 0) {
            onClose();
          }
        },
        onError: (deleteError) => {
          setLocalError(
            deleteError instanceof Error ? deleteError.message : 'Nie udało się usunąć podkładu',
          );
        },
        onSettled: () => {
          setDeletingDraftId(null);
        },
      },
    );
  }

  const drafts = data?.drafts ?? [];

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="z-60 m-auto flex max-h-[min(90vh,40rem)] w-[calc(100%-2rem)] max-w-xl flex-col rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex max-h-[80vh] flex-col">
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Podkłady pracownika</h2>
            <p className="text-sm text-muted-foreground">
              {worker.firstName} {worker.lastName} · {month.month}/{month.year}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Zamknij
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {isLoading && <p className="text-sm text-muted-foreground">Ładowanie podkładów…</p>}
          {isError && (
            <p className="text-sm text-destructive">
              Nie udało się załadować podkładów.
              {error instanceof Error && error.message ? ` (${error.message})` : null}
            </p>
          )}
          {!isLoading && !isError && drafts.length === 0 && (
            <p className="text-sm text-muted-foreground">Brak podkładów do wyświetlenia.</p>
          )}
          {!isLoading && !isError && drafts.length > 0 && (
            <ul className="divide-y rounded-md border">
              {drafts.map((draft) => {
                const isDeleting = deletingDraftId === draft.id;
                const isDownloading = downloadingDraftId === draft.id;

                return (
                  <li
                    key={draft.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{draft.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Dodano: {formatDraftDate(draft.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isDeleting || isDownloading}
                        onClick={() => handleDownload(draft.id)}
                      >
                        {isDownloading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Download className="size-4" />
                        )}
                        Pobierz
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isDeleting || isDownloading}
                        onClick={() => handleDelete(draft.id, draft.fileName)}
                      >
                        {isDeleting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Usuń
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {localError && <p className="text-sm text-destructive">{localError}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Odśwież
          </Button>
          <Button type="button" onClick={onClose}>
            Zamknij
          </Button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
