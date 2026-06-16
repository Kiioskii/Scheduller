import { z } from 'zod';

const shiftTimeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Godzina musi być w formacie GG:MM');

export function shiftTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToShiftTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function shiftTimesAreValid(start: string, end: string): boolean {
  return shiftTimeToMinutes(start) < shiftTimeToMinutes(end);
}

export function normalizeShiftTime(value: unknown): string {
  if (typeof value === 'string' && shiftTimeStringSchema.safeParse(value).success) {
    return value;
  }

  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 24) {
    return minutesToShiftTime(value * 60);
  }

  throw new Error('Invalid shift time value');
}

export const shiftTimeSchema = shiftTimeStringSchema;

export function formatShiftTimeRange(start: string, end: string): string {
  return `${start}–${end}`;
}

export function canSetShiftTimes(start: string, end: string): boolean {
  if (!shiftTimeStringSchema.safeParse(start).success) return false;
  if (!shiftTimeStringSchema.safeParse(end).success) return false;
  return shiftTimesAreValid(start, end);
}
