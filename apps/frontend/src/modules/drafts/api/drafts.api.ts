import {
  analyzeDraftsResultSchema,
  confirmDraftImportsInputSchema,
  confirmDraftImportsResultSchema,
  deleteWorkerDraftResultSchema,
  submitWorkerDraftResultSchema,
  workerDraftFilesResultSchema,
  workerPodkladStatusSchema,
  type AnalyzeDraftsResult,
  type ConfirmDraftImportsInput,
  type ConfirmDraftImportsResult,
  type DeleteWorkerDraftResult,
  type SubmitWorkerDraftResult,
  type WorkerDraftFile,
  type WorkerDraftFilesResult,
  type WorkerPodkladStatus,
} from '@scheduler/shared';

import { apiFetch } from '@/lib/http';

export type {
  AnalyzeDraftsResult,
  ConfirmDraftImportsInput,
  ConfirmDraftImportsResult,
  DeleteWorkerDraftResult,
  SubmitWorkerDraftResult,
  WorkerDraftFile,
  WorkerDraftFilesResult,
  WorkerPodkladStatus,
};

export const draftKeys = {
  all: ['drafts'] as const,
  received: (year: number, month: number) => [...draftKeys.all, 'received', year, month] as const,
  workerFiles: (workerId: string, year: number, month: number) =>
    [...draftKeys.all, 'files', workerId, year, month] as const,
};

const DRAFTS_PATH = '/api/drafts';
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

function parseContentDispositionFileName(header: string | null): string | null {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

export async function fetchReceivedDrafts(
  year: number,
  month: number,
): Promise<WorkerPodkladStatus[]> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  const res = await apiFetch(`${DRAFTS_PATH}/received?${params.toString()}`);
  const json = await handleResponse(res);
  return workerPodkladStatusSchema.array().parse(json);
}

export async function analyzeDraftImports(
  files: File[],
  year: number,
  month: number,
): Promise<AnalyzeDraftsResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });

  const res = await apiFetch(`${DRAFTS_PATH}/analyze?${params.toString()}`, {
    method: 'POST',
    body: formData,
  });
  const json = await handleResponse(res);
  return analyzeDraftsResultSchema.parse(json);
}

export async function confirmDraftImports(params: {
  files: File[];
  payload: ConfirmDraftImportsInput;
}): Promise<ConfirmDraftImportsResult> {
  const formData = new FormData();
  params.files.forEach((file) => formData.append('files', file));
  formData.append('payload', JSON.stringify(confirmDraftImportsInputSchema.parse(params.payload)));

  const res = await apiFetch(`${DRAFTS_PATH}/confirm`, {
    method: 'POST',
    body: formData,
  });
  const json = await handleResponse(res);
  return confirmDraftImportsResultSchema.parse(json);
}

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

  const res = await apiFetch(`${DRAFTS_PATH}/submit`, {
    method: 'POST',
    body: formData,
  });
  const json = await handleResponse(res);
  return submitWorkerDraftResultSchema.parse(json);
}

export async function fetchWorkerDraftFiles(params: {
  workerId: string;
  year: number;
  month: number;
}): Promise<WorkerDraftFilesResult> {
  const searchParams = new URLSearchParams({
    workerId: params.workerId,
    year: String(params.year),
    month: String(params.month),
  });
  const res = await apiFetch(`${DRAFTS_PATH}/files?${searchParams.toString()}`);
  const json = await handleResponse(res);
  return workerDraftFilesResultSchema.parse(json);
}

export async function downloadWorkerDraft(params: {
  workerId: string;
  year: number;
  month: number;
  draftId?: string;
}): Promise<void> {
  const searchParams = new URLSearchParams({
    workerId: params.workerId,
    year: String(params.year),
    month: String(params.month),
  });
  if (params.draftId) {
    searchParams.set('draftId', params.draftId);
  }
  const res = await apiFetch(`${DRAFTS_PATH}/file?${searchParams.toString()}`);

  if (!res.ok) {
    const json = await readJson(res);
    throw new Error(apiErrorMessage(json, res.status));
  }

  const blob = await res.blob();
  const fileName =
    parseContentDispositionFileName(res.headers.get('Content-Disposition')) ?? 'file.xlsx';

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function deleteWorkerDraft(params: {
  workerId: string;
  year: number;
  month: number;
  draftId: string;
}): Promise<DeleteWorkerDraftResult> {
  const searchParams = new URLSearchParams({
    workerId: params.workerId,
    year: String(params.year),
    month: String(params.month),
    draftId: params.draftId,
  });
  const res = await apiFetch(`${DRAFTS_PATH}/file?${searchParams.toString()}`, {
    method: 'DELETE',
  });
  const json = await handleResponse(res);
  return deleteWorkerDraftResultSchema.parse(json);
}

/** Szablon podkładu generowany przez moduł schedules. */
export async function downloadDraftTemplate(year: number, month: number): Promise<void> {
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
