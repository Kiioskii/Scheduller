import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';
import { importedScheduleFileSchema, type ImportedScheduleFile } from '@scheduler/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { useScheduleMutations } from '../hooks/use-schedule';
import { MONTH_LABELS } from '../lib/schedule-month';

const cellSelectClassName =
  'h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

type ImportScheduleDraft = ImportedScheduleFile & { clientId: string };

type ImportSchedulesReviewDialogProps = {
  open: boolean;
  files: ImportedScheduleFile[];
  onClose: () => void;
  onSaved: () => void;
};

function toDrafts(files: ImportedScheduleFile[]): ImportScheduleDraft[] {
  return files.map((file) => ({
    ...file,
    clientId: crypto.randomUUID(),
  }));
}

const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

export function ImportSchedulesReviewDialog({
  open,
  files,
  onClose,
  onSaved,
}: ImportSchedulesReviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { saveSchedulesImport } = useScheduleMutations();
  const [drafts, setDrafts] = useState<ImportScheduleDraft[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    if (open) {
      setDrafts(toDrafts(files));
      setValidationErrors([]);
    }
  }, [open, files]);

  function updateDraft(clientId: string, patch: Partial<ImportedScheduleFile>) {
    setDrafts((current) =>
      current.map((draft) => (draft.clientId === clientId ? { ...draft, ...patch } : draft)),
    );
    setValidationErrors([]);
  }

  function handleSave() {
    const errors: string[] = [];
    const validated: ImportedScheduleFile[] = [];

    drafts.forEach((draft, index) => {
      const parsed = importedScheduleFileSchema.safeParse({
        fileName: draft.fileName.trim(),
        sheetName: draft.sheetName,
        sheetNames: draft.sheetNames,
        rowCount: draft.rowCount,
        year: draft.year,
        month: draft.month,
      });
      if (!parsed.success) {
        const msg = parsed.error.issues.map((issue) => issue.message).join(', ');
        errors.push(`Plik ${index + 1}: ${msg}`);
        return;
      }
      validated.push(parsed.data);
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    saveSchedulesImport.mutate(validated, { onSuccess: onSaved });
  }

  const isSaving = saveSchedulesImport.isPending;

  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="m-auto flex max-h-[min(90vh,40rem)] w-[calc(100%-2rem)] max-w-3xl flex-col rounded-lg border bg-background p-0 shadow-lg [&::backdrop]:bg-black/60"
      onCancel={(event) => {
        if (isSaving) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b p-4">
        <div>
          <h2 className="text-lg font-semibold">Podgląd importu grafików</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sprawdź pliki przed zapisem ({drafts.length}{' '}
            {drafts.length === 1 ? 'plik' : 'pliki'}).
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

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div key={draft.clientId} className="rounded-md border bg-muted/20 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`file-name-${draft.clientId}`}>Nazwa pliku</Label>
                  <Input
                    id={`file-name-${draft.clientId}`}
                    value={draft.fileName}
                    onChange={(e) => updateDraft(draft.clientId, { fileName: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`file-year-${draft.clientId}`}>Rok</Label>
                  <select
                    id={`file-year-${draft.clientId}`}
                    value={draft.year}
                    onChange={(e) => updateDraft(draft.clientId, { year: Number(e.target.value) })}
                    disabled={isSaving}
                    className={cellSelectClassName}
                  >
                    {YEAR_OPTIONS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`file-month-${draft.clientId}`}>Miesiąc</Label>
                  <select
                    id={`file-month-${draft.clientId}`}
                    value={draft.month}
                    onChange={(e) => updateDraft(draft.clientId, { month: Number(e.target.value) })}
                    disabled={isSaving}
                    className={cellSelectClassName}
                  >
                    {MONTH_LABELS.map((label, index) => (
                      <option key={label} value={index + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Arkusz: {draft.sheetName} · wierszy: {draft.rowCount}
                {draft.sheetNames.length > 1 ? ` · arkusze (${draft.sheetNames.length})` : ''}
              </p>
            </div>
          ))}
        </div>

        {validationErrors.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-destructive">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        {saveSchedulesImport.isError && (
          <p className="mt-4 text-sm text-destructive">Nie udało się zapisać grafików.</p>
        )}
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center justify-end gap-2 border-t p-4',
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
