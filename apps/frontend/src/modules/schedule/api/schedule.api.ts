import {
  importedScheduleFileSchema,
  saveImportedSchedulesInputSchema,
  scheduleEntrySchema,
  submitWorkerDraftResultSchema,
  workerPodkladStatusSchema,
  type ImportedScheduleFile,
  type SubmitWorkerDraftResult,
  type WorkerPodkladStatus,
} from '@scheduler/shared';
import { z } from 'zod';

import { apiFetch } from '@/lib/http';

export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;
export type { ImportedScheduleFile, SubmitWorkerDraftResult, WorkerPodkladStatus };

export const scheduleKeys = {
  all: ['schedule'] as const,
  list: () => [...scheduleKeys.all, 'list'] as const,
  imported: () => [...scheduleKeys.all, 'imported'] as const,
  received: (year: number, month: number) =>
    [...scheduleKeys.all, 'received', year, month] as const,
};

const SCHEDULES_PATH = '/api/schedules';

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

/** Tymczasowe dane demo — zamień na fetch z API / Supabase */
export async function submitWorkerDraft(params: {
  workerId: string;
  year: number;
  month: number;
  file: File;
}): Promise<SubmitWorkerDraftResult> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('workerId', params.workerId);
  formData.append('year', String(params.year));
  formData.append('month', String(params.month));

  const res = await apiFetch(`${SCHEDULES_PATH}/drafts/submit`, {
    method: 'POST',
    body: formData,
  });
  const json = await handleResponse(res);
  return submitWorkerDraftResultSchema.parse(json);
}

export async function fetchReceivedSchedules(
  year: number,
  month: number,
): Promise<WorkerPodkladStatus[]> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  const res = await apiFetch(`${SCHEDULES_PATH}/received?${params.toString()}`);
  const json = await handleResponse(res);
  return workerPodkladStatusSchema.array().parse(json);
}

/** Tymczasowe dane demo — zamień na fetch z API / Supabase */
export async function fetchScheduleEntries(): Promise<ScheduleEntry[]> {
  return scheduleEntrySchema.array().parse([
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Zmiana poranna',
      startAt: '2026-05-28T06:00:00.000Z',
      endAt: '2026-05-28T14:00:00.000Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Zmiana popołudniowa',
      startAt: '2026-05-28T14:00:00.000Z',
      endAt: '2026-05-28T22:00:00.000Z',
    },
  ]);
}

export async function parseSchedulesImport(files: File[]): Promise<ImportedScheduleFile[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await apiFetch(`${SCHEDULES_PATH}/import/parse`, {
    method: 'POST',
    body: formData,
  });
  const json = await handleResponse(res);
  return z.array(importedScheduleFileSchema).parse(json);
}

function parseContentDispositionFileName(header: string | null): string | null {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

export async function downloadSchedulePodklad(year: number, month: number): Promise<void> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  const res = await apiFetch(`${SCHEDULES_PATH}/template?${params.toString()}`);

  if (!res.ok) {
    const json = await readJson(res);
    throw new Error(apiErrorMessage(json, res.status));
  }

  const blob = await res.blob();
  const fileName =
    parseContentDispositionFileName(res.headers.get('Content-Disposition')) ??
    `PODKŁAD ${String(month).padStart(2, '0')}.${year}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function saveSchedulesImport(
  files: ImportedScheduleFile[],
): Promise<{ saved: number; files: ImportedScheduleFile[] }> {
  const body = saveImportedSchedulesInputSchema.parse({ files });
  const res = await apiFetch(`${SCHEDULES_PATH}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await handleResponse(res);
  return z
    .object({
      saved: z.number().int(),
      files: z.array(importedScheduleFileSchema),
    })
    .parse(json);
}
