import { useRef, useState } from 'react';
import { Download, List, Loader2, Trash2, Upload } from 'lucide-react';
import type { WorkerPodkladStatus } from '@scheduler/shared';

import { Button } from '@/components/ui/button';

import type { ScheduleMonth } from '../lib/schedule-month';
import { isScheduleExcelFile } from '../lib/schedules-file';
import {
  useDeleteWorkerDraft,
  useDownloadWorkerDraft,
  useSubmitWorkerDraft,
  useWorkerDraftFiles,
} from '@/modules/drafts/hooks/use-received-drafts';

type SubmitWorkerDraftButtonProps = {
  worker: WorkerPodkladStatus;
  month: ScheduleMonth;
  onOpenDraftsList: (worker: WorkerPodkladStatus) => void;
};

export function SubmitWorkerDraftButton({
  worker,
  month,
  onOpenDraftsList,
}: SubmitWorkerDraftButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const submitDraft = useSubmitWorkerDraft(month);
  const downloadDraft = useDownloadWorkerDraft(month);
  const deleteDraft = useDeleteWorkerDraft(month);
  const hasSingleDraft = worker.received && worker.draftCount === 1;
  const { data: singleDraftData } = useWorkerDraftFiles(
    month,
    worker.workerId,
    hasSingleDraft,
  );

  if (worker.deleted) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  function handlePickFile() {
    setLocalError(null);
    inputRef.current?.click();
  }

  function handleFileChange(file: File | undefined) {
    if (!file) return;

    if (!isScheduleExcelFile(file)) {
      setLocalError('Dozwolony format: .xlsx lub .xls');
      return;
    }

    setLocalError(null);
    submitDraft.mutate(
      { workerId: worker.workerId, file },
      {
        onError: (error) => {
          setLocalError(error instanceof Error ? error.message : 'Nie udało się przesłać podkładu');
        },
      },
    );
  }

  function handleDownloadDraft() {
    setLocalError(null);
    downloadDraft.mutate(
      { workerId: worker.workerId },
      {
        onError: (error) => {
          setLocalError(error instanceof Error ? error.message : 'Nie udało się pobrać podkładu');
        },
      },
    );
  }

  function handleDeleteDraft() {
    const draft = singleDraftData?.drafts[0];
    if (!draft) {
      setLocalError('Nie udało się ustalić podkładu do usunięcia');
      return;
    }

    const confirmed = window.confirm(`Usunąć podkład „${draft.fileName}”?`);
    if (!confirmed) return;

    setLocalError(null);
    deleteDraft.mutate(
      { workerId: worker.workerId, draftId: draft.id },
      {
        onError: (error) => {
          setLocalError(error instanceof Error ? error.message : 'Nie udało się usunąć podkładu');
        },
      },
    );
  }

  const isSubmitPending =
    submitDraft.isPending && submitDraft.variables?.workerId === worker.workerId;
  const isDownloadPending =
    downloadDraft.isPending && downloadDraft.variables?.workerId === worker.workerId;
  const isDeletePending =
    deleteDraft.isPending && deleteDraft.variables?.workerId === worker.workerId;
  const hasMultipleDrafts = worker.draftCount > 1;

  if (worker.received && hasMultipleDrafts) {
    return (
      <div className="flex min-w-[9.5rem] flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onOpenDraftsList(worker)}
        >
          <List className="size-4" />
          Podkłady ({worker.draftCount})
        </Button>
        {localError && <p className="text-xs text-destructive">{localError}</p>}
      </div>
    );
  }

  if (worker.received) {
    return (
      <div className="flex min-w-[11rem] flex-col gap-1">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={isDownloadPending || isDeletePending}
            onClick={handleDownloadDraft}
          >
            {isDownloadPending ? (
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
            className="flex-1"
            disabled={isDownloadPending || isDeletePending || !singleDraftData?.drafts[0]}
            onClick={handleDeleteDraft}
          >
            {isDeletePending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Usuń
          </Button>
        </div>
        {localError && <p className="text-xs text-destructive">{localError}</p>}
      </div>
    );
  }

  return (
    <div className="flex min-w-[9.5rem] flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          handleFileChange(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={isSubmitPending}
        onClick={handlePickFile}
      >
        {isSubmitPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        Wyślij podkład
      </Button>
      {localError && <p className="text-xs text-destructive">{localError}</p>}
    </div>
  );
}
