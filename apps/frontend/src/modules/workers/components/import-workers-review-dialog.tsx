import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, X } from 'lucide-react';
import {
  createWorkerInputSchema,
  type CreateWorkerInput,
  type Worker,
} from '@scheduler/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { useWorkerMutations } from '../hooks/use-workers';

const PRIORITY_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const ROLE_OPTIONS = [
  { value: 'worker', label: 'Pracownik' },
  { value: 'boss', label: 'Szef' },
] as const satisfies ReadonlyArray<{ value: Worker['role']; label: string }>;

const cellSelectClassName =
  'h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

type ImportWorkerDraft = CreateWorkerInput & { clientId: string };

type ImportWorkersReviewDialogProps = {
  open: boolean;
  workers: CreateWorkerInput[];
  onClose: () => void;
  onSaved: () => void;
};

function toDrafts(workers: CreateWorkerInput[]): ImportWorkerDraft[] {
  return workers.map((worker) => ({
    ...worker,
    clientId: crypto.randomUUID(),
  }));
}

export function ImportWorkersReviewDialog({
  open,
  workers,
  onClose,
  onSaved,
}: ImportWorkersReviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { createWorkersBulk } = useWorkerMutations();
  const [drafts, setDrafts] = useState<ImportWorkerDraft[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    if (open) {
      setDrafts(toDrafts(workers));
      setValidationErrors([]);
    }
  }, [open, workers]);

  function updateDraft(clientId: string, patch: Partial<CreateWorkerInput>) {
    setDrafts((current) =>
      current.map((draft) => (draft.clientId === clientId ? { ...draft, ...patch } : draft)),
    );
    setValidationErrors([]);
  }

  function handleSave() {
    const errors: string[] = [];
    const validated: CreateWorkerInput[] = [];

    drafts.forEach((draft, index) => {
      const parsed = createWorkerInputSchema.safeParse({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        priority: draft.priority,
        role: draft.role,
        checker: draft.checker,
      });
      if (!parsed.success) {
        const msg = parsed.error.issues.map((issue) => issue.message).join(', ');
        errors.push(`Wiersz ${index + 1}: ${msg}`);
        return;
      }
      validated.push(parsed.data);
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    createWorkersBulk.mutate(validated, {
      onSuccess: onSaved,
    });
  }

  const isSaving = createWorkersBulk.isPending;

  if (!open) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="m-auto flex max-h-[min(90vh,48rem)] w-[calc(100%-2rem)] max-w-4xl flex-col rounded-lg border bg-background p-0 shadow-lg [&::backdrop]:bg-black/60"
      onCancel={(event) => {
        if (isSaving) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Podgląd importu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sprawdź i edytuj dane przed zapisem ({drafts.length}{' '}
            {drafts.length === 1 ? 'osoba' : 'osób'}).
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={onClose}
          disabled={isSaving}
          aria-label="Zamknij podgląd"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Imię</th>
                <th className="px-3 py-2 text-left font-medium">Nazwisko</th>
                <th className="px-3 py-2 text-left font-medium">Priorytet</th>
                <th className="px-3 py-2 text-left font-medium">Rola</th>
                <th className="px-3 py-2 text-left font-medium">Checker</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft) => (
                <tr key={draft.clientId} className="border-t">
                  <td className="px-3 py-2">
                    <Label className="sr-only" htmlFor={`import-first-${draft.clientId}`}>
                      Imię
                    </Label>
                    <Input
                      id={`import-first-${draft.clientId}`}
                      value={draft.firstName}
                      onChange={(e) => updateDraft(draft.clientId, { firstName: e.target.value })}
                      disabled={isSaving}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Label className="sr-only" htmlFor={`import-last-${draft.clientId}`}>
                      Nazwisko
                    </Label>
                    <Input
                      id={`import-last-${draft.clientId}`}
                      value={draft.lastName}
                      onChange={(e) => updateDraft(draft.clientId, { lastName: e.target.value })}
                      disabled={isSaving}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Label className="sr-only" htmlFor={`import-priority-${draft.clientId}`}>
                      Priorytet
                    </Label>
                    <select
                      id={`import-priority-${draft.clientId}`}
                      value={draft.priority}
                      onChange={(e) =>
                        updateDraft(draft.clientId, { priority: Number(e.target.value) })
                      }
                      disabled={isSaving}
                      className={cellSelectClassName}
                    >
                      {PRIORITY_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Label className="sr-only" htmlFor={`import-role-${draft.clientId}`}>
                      Rola
                    </Label>
                    <select
                      id={`import-role-${draft.clientId}`}
                      value={draft.role}
                      onChange={(e) =>
                        updateDraft(draft.clientId, { role: e.target.value as Worker['role'] })
                      }
                      disabled={isSaving}
                      className={cellSelectClassName}
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      variant={draft.checker ? 'default' : 'outline'}
                      size="sm"
                      disabled={isSaving}
                      aria-pressed={draft.checker ?? false}
                      onClick={() => updateDraft(draft.clientId, { checker: !draft.checker })}
                      className="min-w-[4.5rem] gap-1.5"
                    >
                      {draft.checker ? (
                        <>
                          <Check className="size-3.5" />
                          Tak
                        </>
                      ) : (
                        <>
                          <X className="size-3.5" />
                          Nie
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {validationErrors.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-destructive">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        {createWorkersBulk.isError && (
          <p className="mt-4 text-sm text-destructive">Nie udało się zapisać pracowników.</p>
        )}
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center justify-end gap-2 border-t p-4 sm:p-6',
          isSaving && 'pointer-events-none opacity-70',
        )}
      >
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Anuluj
        </Button>
        <Button type="button" onClick={handleSave} disabled={isSaving || drafts.length === 0}>
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Zapisywanie…
            </>
          ) : (
            'Zapisz'
          )}
        </Button>
      </div>
    </dialog>,
    document.body,
  );
}
