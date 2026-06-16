import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ShiftDefinition, Weekday } from '@scheduler/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useShiftTemplateMutations } from '../hooks/use-shift-templates';
import { canSetShiftTimes } from '../lib/shift-time';
import { WeekdayPicker } from './weekday-picker';

type AddShiftTemplateFormProps = {
  onClose: () => void;
  onSuccess?: () => void;
};

type ShiftDraft = {
  clientId: string;
  role: ShiftDefinition['role'];
  requiredWorkers: number;
  start: string;
  end: string;
  weekdays: Weekday[];
};

const ROLE_OPTIONS = [
  { value: 'worker', label: 'Pracownik' },
  { value: 'boss', label: 'Szef' },
] as const satisfies ReadonlyArray<{ value: ShiftDefinition['role']; label: string }>;

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

function createEmptyShift(): ShiftDraft {
  return {
    clientId: crypto.randomUUID(),
    role: 'worker',
    requiredWorkers: 1,
    start: '08:00',
    end: '16:00',
    weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  };
}

export function AddShiftTemplateForm({ onClose, onSuccess }: AddShiftTemplateFormProps) {
  const { createShiftTemplate } = useShiftTemplateMutations();
  const [name, setName] = useState('');
  const [shifts, setShifts] = useState<ShiftDraft[]>([createEmptyShift()]);

  function updateShift(clientId: string, patch: Partial<ShiftDraft>) {
    setShifts((current) =>
      current.map((shift) => (shift.clientId === clientId ? { ...shift, ...patch } : shift)),
    );
  }

  function addShift() {
    setShifts((current) => [...current, createEmptyShift()]);
  }

  function removeShift(clientId: string) {
    setShifts((current) =>
      current.length === 1 ? current : current.filter((shift) => shift.clientId !== clientId),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createShiftTemplate.mutate(
      {
        name: name.trim(),
        shifts: shifts.map(({ role, requiredWorkers, start, end, weekdays }) => ({
          role,
          requiredWorkers,
          start,
          end,
          weekdays,
        })),
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      },
    );
  }

  const shiftsValid = shifts.every(
    (shift) =>
      shift.requiredWorkers >= 1 &&
      shift.weekdays.length > 0 &&
      canSetShiftTimes(shift.start, shift.end),
  );
  const canSubmit = name.trim().length > 0 && shiftsValid && !createShiftTemplate.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="shift-template-name">Nazwa szablonu</Label>
          <Input
            id="shift-template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Zmiany standardowe"
            autoFocus
          />
        </div>

        <div className="space-y-4">
          {shifts.map((shift, index) => (
            <div key={shift.clientId} className="space-y-4 rounded-md border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Zmiana {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  disabled={shifts.length === 1}
                  onClick={() => removeShift(shift.clientId)}
                  aria-label={`Usuń zmianę ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`shift-role-${shift.clientId}`}>Rola</Label>
                  <select
                    id={`shift-role-${shift.clientId}`}
                    value={shift.role}
                    onChange={(e) =>
                      updateShift(shift.clientId, {
                        role: e.target.value as ShiftDefinition['role'],
                      })
                    }
                    className={selectClassName}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`shift-count-${shift.clientId}`}>Liczba pracowników</Label>
                  <Input
                    id={`shift-count-${shift.clientId}`}
                    type="number"
                    min={1}
                    value={shift.requiredWorkers}
                    onChange={(e) =>
                      updateShift(shift.clientId, {
                        requiredWorkers: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`shift-start-${shift.clientId}`}>Godzina rozpoczęcia</Label>
                  <Input
                    id={`shift-start-${shift.clientId}`}
                    type="time"
                    value={shift.start}
                    onChange={(e) => updateShift(shift.clientId, { start: e.target.value })}
                    aria-label={`Godzina rozpoczęcia zmiany ${index + 1}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`shift-end-${shift.clientId}`}>Godzina zakończenia</Label>
                  <Input
                    id={`shift-end-${shift.clientId}`}
                    type="time"
                    value={shift.end}
                    onChange={(e) => updateShift(shift.clientId, { end: e.target.value })}
                    aria-label={`Godzina zakończenia zmiany ${index + 1}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dni tygodnia</Label>
                <WeekdayPicker
                  value={shift.weekdays}
                  onChange={(weekdays) => updateShift(shift.clientId, { weekdays })}
                />
              </div>

              {!canSetShiftTimes(shift.start, shift.end) && (
                <p className="text-sm text-destructive">
                  Godzina zakończenia musi być późniejsza niż rozpoczęcia.
                </p>
              )}
              {shift.weekdays.length === 0 && (
                <p className="text-sm text-destructive">Wybierz co najmniej jeden dzień tygodnia.</p>
              )}
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addShift}>
          <Plus className="size-4" />
          Dodaj zmianę
        </Button>

        {createShiftTemplate.isError && (
          <p className="text-sm text-destructive">
            Nie udało się zapisać szablonu.
            {createShiftTemplate.error instanceof Error && createShiftTemplate.error.message
              ? ` (${createShiftTemplate.error.message})`
              : null}
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Anuluj
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {createShiftTemplate.isPending ? 'Zapisywanie…' : 'Zapisz szablon'}
        </Button>
      </div>
    </form>
  );
}
