import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useShiftTemplates } from '@/modules/shifts';

import type { ScheduleDayAssignment } from '@scheduler/shared';
import { formatScheduleMonth, type ScheduleMonth } from '../lib/schedule-month';
import { ScheduleMonthCalendar } from './schedule-month-calendar';

type GenerateScheduleDialogProps = {
  open: boolean;
  month: ScheduleMonth;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onGenerate: (dayAssignments: ScheduleDayAssignment[]) => void;
  onClearError: () => void;
};

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

export function GenerateScheduleDialog({
  open,
  month,
  isGenerating,
  error,
  onClose,
  onGenerate,
  onClearError,
}: GenerateScheduleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set());
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { data: templates = [], isLoading, isError, error: templatesError } = useShiftTemplates();

  const templateNames = useMemo(
    () => Object.fromEntries(templates.map((template) => [template.id, template.name])),
    [templates],
  );

  const assignedCount = Object.keys(assignments).length;

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
      setSelectedDates(new Set());
      setAssignments({});
      setSelectedTemplateId('');
      setLocalError(null);
    }
  }, [open, month.year, month.month]);

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  function setSelectedDatesFromCalendar(dates: Set<string>) {
    onClearError();
    setLocalError(null);
    setSelectedDates(dates);
  }

  function assignTemplateToSelected() {
    onClearError();
    setLocalError(null);

    if (selectedDates.size === 0) {
      setLocalError('Zaznacz co najmniej jeden dzień w kalendarzu.');
      return;
    }

    if (!selectedTemplateId) {
      setLocalError('Wybierz szablon zmian.');
      return;
    }

    setAssignments((current) => {
      const next = { ...current };
      for (const date of selectedDates) {
        next[date] = selectedTemplateId;
      }
      return next;
    });
    setSelectedDates(new Set());
  }

  function clearAssignmentsForSelected() {
    onClearError();
    setLocalError(null);

    if (selectedDates.size === 0) {
      setLocalError('Zaznacz dni, dla których chcesz usunąć przypisanie.');
      return;
    }

    setAssignments((current) => {
      const next = { ...current };
      for (const date of selectedDates) {
        delete next[date];
      }
      return next;
    });
    setSelectedDates(new Set());
  }

  function handleGenerate() {
    onClearError();
    setLocalError(null);

    const dayAssignments = Object.entries(assignments)
      .map(([date, shiftTemplateId]) => ({ date, shiftTemplateId }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (dayAssignments.length === 0) {
      setLocalError('Przypisz co najmniej jeden dzień do szablonu zmian.');
      return;
    }

    onGenerate(dayAssignments);
  }

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const displayError = localError ?? error;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="z-60 m-auto flex max-h-[min(92vh,52rem)] w-[calc(100%-2rem)] max-w-4xl flex-col rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Wygeneruj grafik</h2>
            <p className="text-sm text-muted-foreground">
              Zaznacz dni w kalendarzu ({formatScheduleMonth(month)}) — klikając lub przeciągając
              myszką — przypisz szablon zmian, a następnie wygeneruj grafik.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Zamknij
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
          {isLoading && <p className="text-sm text-muted-foreground">Ładowanie szablonów zmian…</p>}
          {isError && (
            <p className="text-sm text-destructive">
              Nie udało się załadować szablonów zmian.
              {templatesError instanceof Error && templatesError.message
                ? ` (${templatesError.message})`
                : null}
            </p>
          )}

          {!isLoading && !isError && templates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Brak szablonów zmian. Dodaj szablon w zakładce „Zmiany”, aby móc wygenerować grafik.
            </p>
          )}

          {!isLoading && !isError && templates.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <ScheduleMonthCalendar
                month={month}
                selectedDates={selectedDates}
                assignments={assignments}
                templateNames={templateNames}
                onSelectedDatesChange={setSelectedDatesFromCalendar}
              />

              <div className="space-y-4 rounded-md border bg-muted/20 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Przypisanie szablonu</p>
                  <p className="text-xs text-muted-foreground">
                    Zaznaczono: {selectedDates.size} · Przypisano dni: {assignedCount}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="generate-schedule-template">Szablon zmian</Label>
                  <select
                    id="generate-schedule-template"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className={selectClassName}
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Button type="button" variant="secondary" onClick={assignTemplateToSelected}>
                    Przypisz do zaznaczonych
                  </Button>
                  <Button type="button" variant="outline" onClick={clearAssignmentsForSelected}>
                    Usuń przypisanie
                  </Button>
                </div>

                {templates.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground">Szablony</p>
                    <ul className="space-y-1 text-xs">
                      {templates.map((template) => (
                        <li key={template.id}>{template.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {displayError && <p className="text-sm text-destructive">{displayError}</p>}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            type="button"
            disabled={isGenerating || isLoading || templates.length === 0 || assignedCount === 0}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Wygeneruj grafik
          </Button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
