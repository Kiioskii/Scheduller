/** Dozwolone godziny: 00–24 (tylko pełne godziny). */
export const HOLIDAY_HOUR_OPTIONS = Array.from({ length: 25 }, (_, hour) => hour);

export function formatHolidayHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function isHolidayHour(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= 0 && value <= 24;
}

function hoursAreValid(start: number | null, end: number | null): boolean {
  if (start === null || end === null) return true;
  return start < end;
}

export function canSetHolidayHours(start: number | null, end: number | null): boolean {
  if (start !== null && !isHolidayHour(start)) return false;
  if (end !== null && !isHolidayHour(end)) return false;
  return hoursAreValid(start, end);
}

export function parseHolidayHourSelectValue(value: string): number | null {
  if (value === '') return null;
  const hour = Number(value);
  return isHolidayHour(hour) ? hour : null;
}
