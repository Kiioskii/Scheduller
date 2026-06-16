import type { Weekday } from '@scheduler/shared';

export const WEEKDAY_OPTIONS: ReadonlyArray<{ value: Weekday; label: string; shortLabel: string }> = [
  { value: 'monday', label: 'Poniedziałek', shortLabel: 'Pon' },
  { value: 'tuesday', label: 'Wtorek', shortLabel: 'Wt' },
  { value: 'wednesday', label: 'Środa', shortLabel: 'Śr' },
  { value: 'thursday', label: 'Czwartek', shortLabel: 'Czw' },
  { value: 'friday', label: 'Piątek', shortLabel: 'Pt' },
  { value: 'saturday', label: 'Sobota', shortLabel: 'Sob' },
  { value: 'sunday', label: 'Niedziela', shortLabel: 'Nd' },
];

const ROLE_LABELS: Record<'boss' | 'worker', string> = {
  boss: 'Szef',
  worker: 'Pracownik',
};

export function formatRoleLabel(role: 'boss' | 'worker'): string {
  return ROLE_LABELS[role];
}

export function formatWeekdays(weekdays: Weekday[]): string {
  if (weekdays.length === 0) return '—';
  if (weekdays.length === WEEKDAY_OPTIONS.length) return 'Codziennie';

  const labels = new Map(WEEKDAY_OPTIONS.map((day) => [day.value, day.shortLabel]));
  return weekdays.map((day) => labels.get(day) ?? day).join(', ');
}

export function formatShiftHours(start: string, end: string): string {
  return `${start}–${end}`;
}
