import { createWorkerInputSchema, type CreateWorkerInput } from '@scheduler/shared';
import * as XLSX from 'xlsx';

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;

const FIRST_NAME_HEADERS = new Set([
  'imie',
  'firstname',
  'first_name',
  'first name',
  'pierwsze imie',
]);

const LAST_NAME_HEADERS = new Set([
  'nazwisko',
  'lastname',
  'last_name',
  'last name',
]);

const PRIORITY_HEADERS = new Set(['priorytet', 'priority']);

export type ParseWorkersFileResult = {
  workers: CreateWorkerInput[];
  errors: string[];
};

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function cellToString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return String(value).trim();
}

function parsePriority(value: unknown, rowIndex: number, errors: string[]): number {
  const raw = cellToString(value);
  if (!raw) return 5;
  const parsed = Number(raw.replace(',', '.'));
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
    errors.push(`Wiersz ${rowIndex}: nieprawidłowy priorytet „${raw}” (oczekiwano 1–10).`);
    return 5;
  }
  return parsed;
}

function mapRowByHeaders(
  row: Record<string, unknown>,
  headers: string[],
  rowIndex: number,
  errors: string[],
): CreateWorkerInput | null {
  const normalizedHeaders = headers.map(normalizeHeader);
  let firstName = '';
  let lastName = '';
  let priorityRaw: unknown;

  headers.forEach((header, index) => {
    const key = normalizedHeaders[index];
    const value = row[header];
    if (FIRST_NAME_HEADERS.has(key)) firstName = cellToString(value);
    if (LAST_NAME_HEADERS.has(key)) lastName = cellToString(value);
    if (PRIORITY_HEADERS.has(key)) priorityRaw = value;
  });

  if (!firstName || !lastName) {
    const values = Object.values(row).map(cellToString);
    if (!firstName && values[0]) firstName = values[0];
    if (!lastName && values[1]) lastName = values[1];
    if (priorityRaw === undefined && values[2]) priorityRaw = values[2];
  }

  if (!firstName || !lastName) {
    errors.push(`Wiersz ${rowIndex}: brak imienia lub nazwiska.`);
    return null;
  }

  const priority = parsePriority(priorityRaw, rowIndex, errors);
  const parsed = createWorkerInputSchema.safeParse({
    firstName,
    lastName,
    priority,
    role: 'worker',
  });
  if (!parsed.success) {
    errors.push(`Wiersz ${rowIndex}: ${parsed.error.issues[0]?.message ?? 'nieprawidłowe dane'}.`);
    return null;
  }
  return parsed.data;
}

export function isWorkersFileAccepted(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export async function parseWorkersFile(file: File): Promise<ParseWorkersFileResult> {
  const errors: string[] = [];

  if (!isWorkersFileAccepted(file)) {
    return {
      workers: [],
      errors: ['Obsługiwane formaty: .csv, .xlsx, .xls'],
    };
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { workers: [], errors: ['Plik nie zawiera arkusza z danymi.'] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  if (rows.length === 0) {
    return { workers: [], errors: ['Plik nie zawiera wierszy z danymi.'] };
  }

  const headers = Object.keys(rows[0] ?? {});
  const workers: CreateWorkerInput[] = [];

  rows.forEach((row, index) => {
    const rowIndex = index + 2;
    const parsed = mapRowByHeaders(row, headers, rowIndex, errors);
    if (parsed) workers.push(parsed);
  });

  if (workers.length === 0 && errors.length === 0) {
    errors.push('Nie znaleziono poprawnych wierszy w pliku.');
  }

  return { workers, errors };
}
