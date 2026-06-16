import type { ScheduleMonth } from './schedule-month';

export type ScheduleDateString = `${number}-${string}-${string}`;

export function toScheduleDate(month: ScheduleMonth, day: number): ScheduleDateString {
  const mm = String(month.month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${month.year}-${mm}-${dd}`;
}

export function getDaysInScheduleMonth({ year, month }: ScheduleMonth): number {
  return new Date(year, month, 0).getDate();
}

/** Weeks for a month grid; Monday-first. `null` = empty cell. */
export function getMonthCalendarWeeks(scheduleMonth: ScheduleMonth): Array<Array<number | null>> {
  const { year, month } = scheduleMonth;
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = getDaysInScheduleMonth(scheduleMonth);

  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const weeks: Array<Array<number | null>> = [];
  let currentWeek: Array<number | null> = Array.from({ length: startOffset }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export const CALENDAR_WEEKDAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'] as const;
