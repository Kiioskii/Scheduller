import {
  createHolidayInputSchema,
  holidaySchema,
  updateHolidayInputSchema,
  type CreateHolidayInput,
  type Holiday,
  type UpdateHolidayInput,
} from '@scheduler/shared';
import { apiFetch } from '@/lib/http';

export type { Holiday, CreateHolidayInput, UpdateHolidayInput };

export const holidayKeys = {
  all: ['holidays'] as const,
  list: (year: number) => [...holidayKeys.all, 'list', year] as const,
};

const HOLIDAYS_PATH = '/api/holidays';

async function readJson(res: Response): Promise<unknown> {
  return res.json() as Promise<unknown>;
}

function apiErrorMessage(json: unknown, status: number): string {
  if (typeof json === 'object' && json !== null) {
    const payload = json as { message?: unknown; errors?: unknown };
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      return payload.errors.map(String).join('\n');
    }
    if (typeof payload.message === 'string') return payload.message;
    if (Array.isArray(payload.message)) return payload.message.map(String).join(', ');
  }
  return `Żądanie nie powiodło się (${status})`;
}

async function handleResponse(res: Response): Promise<unknown> {
  const json = await readJson(res);
  if (!res.ok) {
    throw new Error(apiErrorMessage(json, res.status));
  }
  return json;
}

export async function fetchHolidays(year: number): Promise<Holiday[]> {
  const res = await apiFetch(`${HOLIDAYS_PATH}?year=${year}`);
  const json = await handleResponse(res);
  const parsed = holidaySchema.array().safeParse(json);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}

export async function createHolidays(input: CreateHolidayInput): Promise<Holiday[]> {
  const body = createHolidayInputSchema.parse(input);
  const res = await apiFetch(HOLIDAYS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await handleResponse(res);
  return holidaySchema.array().parse(json);
}

export async function updateHoliday(id: string, input: UpdateHolidayInput): Promise<Holiday> {
  const body = updateHolidayInputSchema.parse(input);
  const res = await apiFetch(`${HOLIDAYS_PATH}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await handleResponse(res);
  return holidaySchema.parse(json);
}

export async function deleteHoliday(id: string): Promise<void> {
  const res = await apiFetch(`${HOLIDAYS_PATH}/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(res);
}
