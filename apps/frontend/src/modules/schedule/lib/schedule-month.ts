export type ScheduleMonth = {
  year: number;
  /** 1–12 */
  month: number;
};

export const MONTH_LABELS = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
] as const;

export function getCurrentScheduleMonth(): ScheduleMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function formatScheduleMonth({ year, month }: ScheduleMonth): string {
  const label = MONTH_LABELS[month - 1];
  return label ? `${label} ${year}` : `${month}/${year}`;
}

export function formatScheduleTitle({ year, month }: ScheduleMonth): string {
  const label = MONTH_LABELS[month - 1];
  return label ? `Grafik na ${label} ${year}` : `Grafik na ${month}/${year}`;
}

export function isSameScheduleMonth(a: ScheduleMonth, b: ScheduleMonth): boolean {
  return a.year === b.year && a.month === b.month;
}
