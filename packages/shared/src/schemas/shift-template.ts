import { z } from 'zod';

import { workerRoleSchema } from './worker';

export const weekdaySchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

const shiftTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Godzina musi być w formacie GG:MM');

function shiftTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function shiftTimesAreValid(start: string, end: string): boolean {
  return shiftTimeToMinutes(start) < shiftTimeToMinutes(end);
}

/** Supabase Shift_templates.id is bigint — exposed in API as string */
export const shiftTemplateIdSchema = z.coerce.string().min(1);

export const shiftDefinitionSchema = z
  .object({
    role: workerRoleSchema,
    requiredWorkers: z.number().int().min(1),
    start: shiftTimeSchema,
    end: shiftTimeSchema,
    weekdays: z.array(weekdaySchema).min(1),
  })
  .refine((data) => shiftTimesAreValid(data.start, data.end), {
    message: 'Godzina zakończenia musi być późniejsza niż rozpoczęcia',
    path: ['end'],
  });

export const shiftTemplateSchema = z.object({
  id: shiftTemplateIdSchema,
  name: z.string().min(1),
  shifts: z.array(shiftDefinitionSchema).min(1),
  createdAt: z.string(),
});

export const createShiftTemplateInputSchema = z.object({
  name: z.string().min(1),
  shifts: z.array(shiftDefinitionSchema).min(1),
});

export const updateShiftTemplateInputSchema = z
  .object({
    name: z.string().min(1).optional(),
    shifts: z.array(shiftDefinitionSchema).min(1).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

export type Weekday = z.infer<typeof weekdaySchema>;
export type ShiftDefinition = z.infer<typeof shiftDefinitionSchema>;
export type ShiftTemplate = z.infer<typeof shiftTemplateSchema>;
export type CreateShiftTemplateInput = z.infer<typeof createShiftTemplateInputSchema>;
export type UpdateShiftTemplateInput = z.infer<typeof updateShiftTemplateInputSchema>;
