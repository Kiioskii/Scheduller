import {
  createWorkerInputSchema,
  updateWorkerInputSchema,
  workerPrioritySchema,
  workerSchema,
  type CreateWorkerInput,
  type UpdateWorkerInput,
  type Worker,
} from '@scheduler/shared';
import { z } from 'zod';
import { apiFetch } from '@/lib/http';

export type { Worker, CreateWorkerInput, UpdateWorkerInput };

export const workerKeys = {
  all: ['workers'] as const,
  list: () => [...workerKeys.all, 'list'] as const,
};

const WORKERS_PATH = '/api/workers';

function normalizeCreateInput(
  input: Omit<CreateWorkerInput, 'role'> & Partial<Pick<CreateWorkerInput, 'role'>>,
): CreateWorkerInput {
  return createWorkerInputSchema.parse({ role: 'worker', ...input });
}

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

export async function fetchWorkers(): Promise<Worker[]> {
  const res = await apiFetch(WORKERS_PATH);
  const json = await handleResponse(res);
  const parsed = workerSchema.array().safeParse(json);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}

export async function parseWorkersImport(file: File): Promise<CreateWorkerInput[]> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiFetch(`${WORKERS_PATH}/import/parse`, {
    method: 'POST',
    body: formData,
  });
  const json = await handleResponse(res);
  return z.array(createWorkerInputSchema).parse(json);
}

export async function createWorker(
  input: Omit<CreateWorkerInput, 'role'> & Partial<Pick<CreateWorkerInput, 'role'>>,
): Promise<Worker> {
  const body = normalizeCreateInput(input);
  const res = await apiFetch(WORKERS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await handleResponse(res);
  return workerSchema.parse(json);
}

export async function createWorkers(inputs: CreateWorkerInput[]): Promise<Worker[]> {
  if (inputs.length === 0) return [];
  return Promise.all(inputs.map((input) => createWorker(input)));
}

export async function updateWorker(id: string, input: UpdateWorkerInput): Promise<Worker> {
  const body = updateWorkerInputSchema.parse(input);
  const res = await apiFetch(`${WORKERS_PATH}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await handleResponse(res);
  return workerSchema.parse(json);
}

export async function updateWorkerPriority(id: string, priority: number): Promise<Worker> {
  const parsedPriority = workerPrioritySchema.parse(priority);
  return updateWorker(id, { priority: parsedPriority });
}

export async function deleteWorker(id: string): Promise<void> {
  await updateWorker(id, { deleted: true });
}

export async function restoreWorker(id: string): Promise<Worker> {
  return updateWorker(id, { deleted: false });
}
