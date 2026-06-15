import { holidaySchema, type CreateHolidayInput, type Holiday, type UpdateHolidayInput } from '@scheduler/shared';

/** Supabase table `Holidays`. */
export type HolidayRow = {
  id: number | string;
  created_at: string;
  name: string | null;
  date: string;
  start: number | null;
  end: number | null;
};

export function rowToHoliday(row: HolidayRow): Holiday {
  return holidaySchema.parse({
    id: String(row.id),
    createdAt: row.created_at,
    name: row.name,
    date: row.date,
    start: row.start,
    end: row.end,
  });
}

export function createInputToRows(
  input: CreateHolidayInput,
): Array<Pick<HolidayRow, 'name' | 'date' | 'start' | 'end'>> {
  const endDate = input.endDate ?? input.startDate;
  const rows: Array<Pick<HolidayRow, 'name' | 'date' | 'start' | 'end'>> = [];

  let current = input.startDate;
  while (current <= endDate) {
    rows.push({
      name: input.name ?? null,
      date: current,
      start: input.start ?? null,
      end: input.end ?? null,
    });
    current = addDays(current, 1);
  }

  return rows;
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00`);
  parsed.setDate(parsed.getDate() + days);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function updateInputToRow(
  input: UpdateHolidayInput,
): Partial<Pick<HolidayRow, 'name' | 'date' | 'start' | 'end'>> {
  const row: Partial<Pick<HolidayRow, 'name' | 'date' | 'start' | 'end'>> = {};

  if (input.name !== undefined) row.name = input.name;
  if (input.date !== undefined) row.date = input.date;
  if (input.start !== undefined) row.start = input.start;
  if (input.end !== undefined) row.end = input.end;

  return row;
}
