import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useHolidayMutations } from '../hooks/use-holidays';
import { canSetHolidayHours } from '../lib/holiday-hours';
import { HolidayHourSelect } from './holiday-hour-select';

type AddHolidayFormProps = {
  year: number;
  onClose: () => void;
};

type DateMode = 'single' | 'range';

const DEFAULT_OPEN_HOUR = 8;
const DEFAULT_CLOSE_HOUR = 17;

export function AddHolidayForm({ year, onClose }: AddHolidayFormProps) {
  const { createHolidays } = useHolidayMutations(year);
  const [name, setName] = useState('');
  const [dateMode, setDateMode] = useState<DateMode>('single');
  const [startDate, setStartDate] = useState(`${year}-01-01`);
  const [endDate, setEndDate] = useState(`${year}-01-01`);
  const [openHour, setOpenHour] = useState<number | null>(DEFAULT_OPEN_HOUR);
  const [closeHour, setCloseHour] = useState<number | null>(DEFAULT_CLOSE_HOUR);
  const [includeHours, setIncludeHours] = useState(true);

  function resetForm() {
    setName('');
    setDateMode('single');
    setStartDate(`${year}-01-01`);
    setEndDate(`${year}-01-01`);
    setOpenHour(DEFAULT_OPEN_HOUR);
    setCloseHour(DEFAULT_CLOSE_HOUR);
    setIncludeHours(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const start = includeHours ? openHour : null;
    const end = includeHours ? closeHour : null;
    if (!canSetHolidayHours(start, end)) return;

    createHolidays.mutate(
      {
        name: name.trim() || null,
        startDate,
        endDate: dateMode === 'range' ? endDate : undefined,
        start,
        end,
      },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      },
    );
  }

  const startHour = includeHours ? openHour : null;
  const endHour = includeHours ? closeHour : null;
  const hoursValid = canSetHolidayHours(startHour, endHour);
  const canSubmit = startDate.length > 0 && hoursValid && !createHolidays.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 size-8"
        onClick={onClose}
        aria-label="Zamknij formularz"
      >
        <X className="size-4" />
      </Button>

      <div className="space-y-2 sm:col-span-2">
        <p className="text-sm font-medium">Nowe święto</p>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="holiday-name">Nazwa święta</Label>
        <Input
          id="holiday-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Boże Narodzenie"
          autoFocus
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label>Typ daty</Label>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="holiday-date-mode"
              checked={dateMode === 'single'}
              onChange={() => setDateMode('single')}
              className="size-4"
            />
            Jeden dzień
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="holiday-date-mode"
              checked={dateMode === 'range'}
              onChange={() => setDateMode('range')}
              className="size-4"
            />
            Kilka dni pod rząd
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="holiday-start-date">
          {dateMode === 'single' ? 'Data' : 'Data początkowa'}
        </Label>
        <Input
          id="holiday-start-date"
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            if (dateMode === 'range' && e.target.value > endDate) {
              setEndDate(e.target.value);
            }
          }}
          required
        />
      </div>

      {dateMode === 'range' && (
        <div className="space-y-2">
          <Label htmlFor="holiday-end-date">Data końcowa</Label>
          <Input
            id="holiday-end-date"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      )}

      <div className="space-y-2 sm:col-span-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeHours}
            onChange={(e) => setIncludeHours(e.target.checked)}
            className="size-4"
          />
          Ustaw godziny otwarcia i zamknięcia
        </label>
      </div>

      {includeHours && (
        <>
          <div className="space-y-2">
            <Label htmlFor="holiday-open-hour">Godzina otwarcia</Label>
            <HolidayHourSelect
              id="holiday-open-hour"
              value={openHour}
              allowEmpty={false}
              onChange={(hour) => {
                if (hour === null) return;
                if (canSetHolidayHours(hour, closeHour)) setOpenHour(hour);
              }}
              aria-label="Godzina otwarcia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="holiday-close-hour">Godzina zamknięcia</Label>
            <HolidayHourSelect
              id="holiday-close-hour"
              value={closeHour}
              allowEmpty={false}
              onChange={(hour) => {
                if (hour === null) return;
                if (canSetHolidayHours(openHour, hour)) setCloseHour(hour);
              }}
              aria-label="Godzina zamknięcia"
            />
          </div>
        </>
      )}

      {includeHours && !hoursValid && (
        <p className="text-sm text-destructive sm:col-span-2">
          Godzina zamknięcia musi być późniejsza niż otwarcia.
        </p>
      )}

      <div className="flex items-end gap-2 sm:col-span-2">
        <Button type="submit" disabled={!canSubmit}>
          {createHolidays.isPending ? 'Dodawanie…' : 'Dodaj święto'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Anuluj
        </Button>
      </div>

      {createHolidays.isError && (
        <p className="text-sm text-destructive sm:col-span-2">
          Nie udało się dodać święta.
          {createHolidays.error instanceof Error && createHolidays.error.message
            ? ` (${createHolidays.error.message})`
            : null}
        </p>
      )}
    </form>
  );
}
