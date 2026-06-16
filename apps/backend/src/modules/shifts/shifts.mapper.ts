import {
  shiftDefinitionSchema,
  shiftTemplateSchema,
  type CreateShiftTemplateInput,
  type ShiftDefinition,
  type ShiftTemplate,
  type UpdateShiftTemplateInput,
} from '@scheduler/shared';

/** Supabase table `Shift_templates`. */
export type ShiftTemplateRow = {
  id: number | string;
  created_at: string;
  name: string;
  shifts: unknown[];
};

function normalizeShiftTime(value: unknown): string {
  if (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return value;
  }

  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 24) {
    return `${String(value).padStart(2, '0')}:00`;
  }

  throw new Error('Invalid shift time value');
}

function normalizeShiftDefinition(shift: unknown): ShiftDefinition {
  if (typeof shift !== 'object' || shift === null) {
    throw new Error('Invalid shift definition');
  }

  const record = shift as Record<string, unknown>;

  return shiftDefinitionSchema.parse({
    ...record,
    start: normalizeShiftTime(record.start),
    end: normalizeShiftTime(record.end),
  });
}

export function rowToShiftTemplate(row: ShiftTemplateRow): ShiftTemplate {
  return shiftTemplateSchema.parse({
    id: String(row.id),
    name: row.name,
    shifts: row.shifts.map(normalizeShiftDefinition),
    createdAt: row.created_at,
  });
}

export function createInputToRow(
  input: CreateShiftTemplateInput,
): Pick<ShiftTemplateRow, 'name' | 'shifts'> {
  return {
    name: input.name,
    shifts: input.shifts.map((shift) => shiftDefinitionSchema.parse(shift)),
  };
}

export function updateInputToRow(
  input: UpdateShiftTemplateInput,
): Partial<Pick<ShiftTemplateRow, 'name' | 'shifts'>> {
  const row: Partial<Pick<ShiftTemplateRow, 'name' | 'shifts'>> = {};

  if (input.name !== undefined) row.name = input.name;
  if (input.shifts !== undefined) {
    row.shifts = input.shifts.map((shift) => shiftDefinitionSchema.parse(shift));
  }

  return row;
}
