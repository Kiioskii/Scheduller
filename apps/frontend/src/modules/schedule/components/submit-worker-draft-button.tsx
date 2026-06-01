import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import type { WorkerPodkladStatus } from '@scheduler/shared';

import { Button } from '@/components/ui/button';

import type { ScheduleMonth } from '../lib/schedule-month';
import { isScheduleExcelFile } from '../lib/schedules-file';
import { useSubmitWorkerDraft } from '../hooks/use-received-schedules';

type SubmitWorkerDraftButtonProps = {
  worker: WorkerPodkladStatus;
  month: ScheduleMonth;
};

export function SubmitWorkerDraftButton({ worker, month }: SubmitWorkerDraftButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const submitDraft = useSubmitWorkerDraft(month);

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

  const isPending =
    submitDraft.isPending && submitDraft.variables?.workerId === worker.workerId;

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
        disabled={isPending}
        onClick={handlePickFile}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        Wyślij podkład
      </Button>
      {localError && <p className="text-xs text-destructive">{localError}</p>}
    </div>
  );
}
