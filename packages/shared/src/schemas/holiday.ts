import { z } from 'zod';

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data musi być w formacie RRRR-MM-DD');

/** Godzina otwarcia/zamknięcia obiektu (0–24), null = brak ustawienia. */
export const holidayHourSchema = z.number().int().min(0).max(24);

const nullableHolidayHourSchema = holidayHourSchema.nullable();

/** Supabase Holidays.id is bigint — exposed in API as string */
export const holidayIdSchema = z.coerce.string().min(1);

function hoursAreValid(start: number | null, end: number | null): boolean {
  if (start === null || end === null) return true;
  return start < end;
}

export const holidaySchema = z
  .object({
    id: holidayIdSchema,
    createdAt: z.string(),
    name: z.string().nullable(),
    date: dateStringSchema,
    start: nullableHolidayHourSchema,
    end: nullableHolidayHourSchema,
  })
  .refine((data) => hoursAreValid(data.start, data.end), {
    message: 'Godzina zamknięcia musi być późniejsza niż otwarcia',
    path: ['end'],
  });

export const createHolidayInputSchema = z
  .object({
    name: z.string().min(1).nullable().optional(),
    startDate: dateStringSchema,
    endDate: dateStringSchema.optional(),
    start: nullableHolidayHourSchema.optional(),
    end: nullableHolidayHourSchema.optional(),
  })
  .refine(
    (data) => {
      const end = data.endDate ?? data.startDate;
      return end >= data.startDate;
    },
    { message: 'Data końcowa nie może być wcześniejsza niż początkowa', path: ['endDate'] },
  )
  .refine((data) => hoursAreValid(data.start ?? null, data.end ?? null), {
    message: 'Godzina zamknięcia musi być późniejsza niż otwarcia',
    path: ['end'],
  });

export const updateHolidayInputSchema = z
  .object({
    name: z.string().min(1).nullable().optional(),
    date: dateStringSchema.optional(),
    start: nullableHolidayHourSchema.optional(),
    end: nullableHolidayHourSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  })
  .refine(
    (data) => {
      if (data.start === undefined || data.end === undefined) return true;
      return hoursAreValid(data.start, data.end);
    },
    { message: 'Godzina zamknięcia musi być późniejsza niż otwarcia', path: ['end'] },
  );

export type Holiday = z.infer<typeof holidaySchema>;
export type CreateHolidayInput = z.infer<typeof createHolidayInputSchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidayInputSchema>;
