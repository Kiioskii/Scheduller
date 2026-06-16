import {
  createShiftTemplateInputSchema,
  shiftTemplateSchema,
  updateShiftTemplateInputSchema,
  type CreateShiftTemplateInput,
  type ShiftTemplate,
  type UpdateShiftTemplateInput,
} from '@scheduler/shared';
import { apiFetch } from '@/lib/http';

export type { ShiftTemplate, CreateShiftTemplateInput, UpdateShiftTemplateInput };

export const shiftTemplateKeys = {
  all: ['shift-templates'] as const,
  list: () => [...shiftTemplateKeys.all, 'list'] as const,
};

const SHIFT_TEMPLATES_PATH = '/api/shift-templates';

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

export async function fetchShiftTemplates(): Promise<ShiftTemplate[]> {
  const res = await apiFetch(SHIFT_TEMPLATES_PATH);
  const json = await handleResponse(res);
  return shiftTemplateSchema.array().parse(json);
}

export async function createShiftTemplate(input: CreateShiftTemplateInput): Promise<ShiftTemplate> {
  const body = createShiftTemplateInputSchema.parse(input);
  const res = await apiFetch(SHIFT_TEMPLATES_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await handleResponse(res);
  return shiftTemplateSchema.parse(json);
}

export async function updateShiftTemplate(
  id: string,
  input: UpdateShiftTemplateInput,
): Promise<ShiftTemplate> {
  const body = updateShiftTemplateInputSchema.parse(input);
  const res = await apiFetch(`${SHIFT_TEMPLATES_PATH}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await handleResponse(res);
  return shiftTemplateSchema.parse(json);
}

export async function deleteShiftTemplate(id: string): Promise<void> {
  const res = await apiFetch(`${SHIFT_TEMPLATES_PATH}/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(res);
}
