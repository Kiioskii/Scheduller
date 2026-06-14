import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, UserPlus, X } from 'lucide-react';
import type {
  AnalyzeDraftsResult,
  AnalyzedDraft,
  ConfirmDraftImportAssignment,
  CreateWorkerInput,
  MatchedDraft,
} from '@scheduler/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useDraftImportMutations } from '@/modules/drafts/hooks/use-draft-import';
import type { ScheduleMonth } from '../lib/schedule-month';
import type { DraftImportSession } from './import-drafts-form';

const selectClassName =
  'h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

type DraftResolution =
  | {
      kind: 'existing';
      workerId: string;
      workerName: string;
    }
  | {
      kind: 'new';
      worker: CreateWorkerInput;
    };

type ImportDraftsReviewDialogProps = {
  open: boolean;
  month: ScheduleMonth;
  session: DraftImportSession;
  onClose: () => void;
  onSaved: () => void;
};

function draftPersonLabel(draft: AnalyzedDraft): string {
  return `${draft.firstName} ${draft.lastName}`;
}

export function ImportDraftsReviewDialog({
  open,
  month,
  session,
  onClose,
  onSaved,
}: ImportDraftsReviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { confirmDrafts } = useDraftImportMutations(month);
  const [matched, setMatched] = useState<MatchedDraft[]>([]);
  const [unmatched, setUnmatched] = useState<AnalyzedDraft[]>([]);
  const [activeWorkers, setActiveWorkers] = useState<AnalyzeDraftsResult['activeWorkers']>([]);
  const [resolutions, setResolutions] = useState<Record<string, DraftResolution>>({});
  const [selectedWorkerByDraft, setSelectedWorkerByDraft] = useState<Record<string, string>>({});
  const [addingDraftId, setAddingDraftId] = useState<string | null>(null);
  const [newWorkerForms, setNewWorkerForms] = useState<
    Record<string, CreateWorkerInput>
  >({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
    if (!open) return;
    setMatched(session.analysis.matched);
    setUnmatched(session.analysis.unmatched);
    setActiveWorkers(session.analysis.activeWorkers);
    setResolutions({});
    setSelectedWorkerByDraft({});
    setAddingDraftId(null);
    setNewWorkerForms({});
    setValidationErrors([]);
  }, [open, session]);

  const pendingUnmatched = useMemo(
    () => unmatched.filter((draft) => !resolutions[draft.clientId]),
    [unmatched, resolutions],
  );

  const resolvedEntries = useMemo(
    () =>
      unmatched
        .filter((draft) => resolutions[draft.clientId])
        .map((draft) => ({
          draft,
          resolution: resolutions[draft.clientId]!,
        })),
    [unmatched, resolutions],
  );

  function assignToWorker(draft: AnalyzedDraft) {
    const workerId = selectedWorkerByDraft[draft.clientId];
    if (!workerId) {
      setValidationErrors(['Wybierz pracownika do przypisania podkładu.']);
      return;
    }

    const worker = activeWorkers.find((item) => item.id === workerId);
    if (!worker) return;

    setResolutions((current) => ({
      ...current,
      [draft.clientId]: {
        kind: 'existing',
        workerId: worker.id,
        workerName: `${worker.firstName} ${worker.lastName}`,
      },
    }));
    setValidationErrors([]);
    setAddingDraftId(null);
  }

  function openAddWorkerForm(draft: AnalyzedDraft) {
    setAddingDraftId(draft.clientId);
    setNewWorkerForms((current) => ({
      ...current,
      [draft.clientId]: current[draft.clientId] ?? {
        firstName: draft.firstName,
        lastName: draft.lastName,
        role: 'worker',
        priority: 5,
        checker: false,
      },
    }));
    setValidationErrors([]);
  }

  function saveNewWorkerForDraft(draft: AnalyzedDraft) {
    const worker = newWorkerForms[draft.clientId];
    if (!worker?.firstName.trim() || !worker.lastName.trim()) {
      setValidationErrors(['Imię i nazwisko nowego pracownika są wymagane.']);
      return;
    }

    setResolutions((current) => ({
      ...current,
      [draft.clientId]: {
        kind: 'new',
        worker: {
          ...worker,
          firstName: worker.firstName.trim(),
          lastName: worker.lastName.trim(),
        },
      },
    }));
    setAddingDraftId(null);
    setValidationErrors([]);
  }

  function buildAssignments(): ConfirmDraftImportAssignment[] {
    const assignments: ConfirmDraftImportAssignment[] = matched.map((entry) => ({
      clientId: entry.draft.clientId,
      kind: 'existing',
      workerId: entry.worker.id,
    }));

    for (const entry of resolvedEntries) {
      const resolution = entry.resolution;
      if (resolution.kind === 'existing') {
        assignments.push({
          clientId: entry.draft.clientId,
          kind: 'existing',
          workerId: resolution.workerId,
        });
      } else {
        assignments.push({
          clientId: entry.draft.clientId,
          kind: 'new',
          worker: resolution.worker,
        });
      }
    }

    return assignments;
  }

  function handleConfirm() {
    if (pendingUnmatched.length > 0) {
      setValidationErrors(['Przypisz lub dodaj pracownika dla każdego nierozpoznanego podkładu.']);
      return;
    }

    const assignments = buildAssignments();
    const clientIds = assignments.map((item) => item.clientId).sort((a, b) => Number(a) - Number(b));
    const files = clientIds.map((clientId) => {
      const file = session.filesByClientId.get(clientId);
      if (!file) {
        throw new Error(`Brak pliku dla podkładu ${clientId}`);
      }
      return file;
    });

    confirmDrafts.mutate(
      {
        files,
        payload: {
          year: month.year,
          month: month.month,
          assignments,
        },
      },
      {
        onSuccess: onSaved,
        onError: (error) => {
          setValidationErrors([
            error instanceof Error ? error.message : 'Nie udało się zapisać podkładów.',
          ]);
        },
      },
    );
  }

  const isSaving = confirmDrafts.isPending;

  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="z-[60] m-auto flex max-h-[min(90vh,40rem)] w-[calc(100%-2rem)] max-w-3xl flex-col rounded-lg border bg-background p-0 shadow-lg [&::backdrop]:bg-black/60"
      onCancel={(event) => {
        if (isSaving) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Wynik analizy podkładów</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Podkłady zostały przeanalizowane bez zapisu. Potwierdź dopasowania poniżej.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isSaving}
          aria-label="Zamknij"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            Dopasowane podkłady ({matched.length + resolvedEntries.length})
          </h3>
          {matched.length === 0 && resolvedEntries.length === 0 && (
            <p className="text-sm text-muted-foreground">Brak automatycznie dopasowanych podkładów.</p>
          )}
          <ul className="space-y-2">
            {matched.map((entry) => (
              <li
                key={entry.draft.clientId}
                className="rounded-md border bg-emerald-500/5 px-3 py-2 text-sm"
              >
                <p className="font-medium">
                  {entry.worker.firstName} {entry.worker.lastName}
                </p>
                <p className="text-muted-foreground">{entry.draft.fileName}</p>
              </li>
            ))}
            {resolvedEntries.map(({ draft, resolution }) => (
              <li
                key={draft.clientId}
                className="rounded-md border bg-emerald-500/5 px-3 py-2 text-sm"
              >
                <p className="font-medium">
                  {resolution.kind === 'existing'
                    ? resolution.workerName
                    : `${resolution.worker.firstName} ${resolution.worker.lastName} (nowy)`}
                </p>
                <p className="text-muted-foreground">{draft.fileName}</p>
              </li>
            ))}
          </ul>
        </section>

        {pendingUnmatched.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Nierozpoznane podkłady ({pendingUnmatched.length})</h3>
            <div className="space-y-4">
              {pendingUnmatched.map((draft) => {
                const form = newWorkerForms[draft.clientId];
                const isAdding = addingDraftId === draft.clientId;

                return (
                  <div key={draft.clientId} className="space-y-3 rounded-md border p-3">
                    <div>
                      <p className="font-medium">{draftPersonLabel(draft)}</p>
                      <p className="text-sm text-muted-foreground">{draft.fileName}</p>
                    </div>

                    {!isAdding && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={`assign-worker-${draft.clientId}`}>Przypisz do pracownika</Label>
                          <select
                            id={`assign-worker-${draft.clientId}`}
                            value={selectedWorkerByDraft[draft.clientId] ?? ''}
                            onChange={(event) =>
                              setSelectedWorkerByDraft((current) => ({
                                ...current,
                                [draft.clientId]: event.target.value,
                              }))
                            }
                            className={selectClassName}
                          >
                            <option value="">Wybierz pracownika…</option>
                            {activeWorkers.map((worker) => (
                              <option key={worker.id} value={worker.id}>
                                {worker.firstName} {worker.lastName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button type="button" variant="outline" onClick={() => assignToWorker(draft)}>
                          <Check className="size-4" />
                          Przypisz podkład
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => openAddWorkerForm(draft)}>
                          <UserPlus className="size-4" />
                          Dodaj pracownika
                        </Button>
                      </div>
                    )}

                    {isAdding && form && (
                      <div className="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`new-first-${draft.clientId}`}>Imię</Label>
                          <Input
                            id={`new-first-${draft.clientId}`}
                            value={form.firstName}
                            onChange={(event) =>
                              setNewWorkerForms((current) => ({
                                ...current,
                                [draft.clientId]: { ...form, firstName: event.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`new-last-${draft.clientId}`}>Nazwisko</Label>
                          <Input
                            id={`new-last-${draft.clientId}`}
                            value={form.lastName}
                            onChange={(event) =>
                              setNewWorkerForms((current) => ({
                                ...current,
                                [draft.clientId]: { ...form, lastName: event.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                          <Button type="button" onClick={() => saveNewWorkerForDraft(draft)}>
                            Zapisz pracownika i przypisz podkład
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => setAddingDraftId(null)}>
                            Anuluj
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {validationErrors.length > 0 && (
          <ul className="space-y-1 text-sm text-destructive">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Anuluj
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isSaving || pendingUnmatched.length > 0}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          Zatwierdź i zapisz podkłady
        </Button>
      </div>
    </dialog>,
    document.body,
  );
}
