import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

import type { AnalyzedDraft } from '@scheduler/shared';

const POLISH_MONTHS: Record<string, number> = {
  STYCZEN: 1,
  LUTY: 2,
  MARZEC: 3,
  KWIECIEN: 4,
  MAJ: 5,
  CZERWIEC: 6,
  LIPIEC: 7,
  SIERPIEN: 8,
  WRZESIEN: 9,
  PAZDZIERNIK: 10,
  LISTOPAD: 11,
  GRUDZIEN: 12,
};

export type ParsedPodkladDraft = Pick<
  AnalyzedDraft,
  'fileName' | 'firstName' | 'lastName' | 'year' | 'month'
>;

export function parsePodkladDraftFile(
  fileName: string,
  fileBuffer: Buffer,
  clientId: string,
): AnalyzedDraft {
  if (!fileBuffer?.length) {
    throw new BadRequestException('Plik jest pusty');
  }

  const parsed = parsePodkladDraftContent(fileName, fileBuffer);
  return { clientId, ...parsed };
}

export function parsePodkladDraftContent(
  fileName: string,
  fileBuffer: Buffer,
): ParsedPodkladDraft {
  assertExcelFile(fileName);

  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new BadRequestException('Plik nie zawiera arkusza');
  }

  const worksheet = workbook.Sheets[sheetName];
  const names = extractWorkerNames(worksheet);
  const { year, month } = extractYearMonth(worksheet, fileName);

  return {
    fileName,
    firstName: names.firstName,
    lastName: names.lastName,
    year,
    month,
  };
}

function extractWorkerNames(worksheet: XLSX.WorkSheet): { firstName: string; lastName: string } {
  const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1:B20');

  for (let row = range.s.r; row <= Math.min(range.e.r, range.s.r + 15); row += 1) {
    const lastNameHeader = cellText(worksheet, row, 0);
    const firstNameHeader = cellText(worksheet, row, 1);
    if (!isLastNameHeader(lastNameHeader) || !isFirstNameHeader(firstNameHeader)) {
      continue;
    }

    const lastName = cellText(worksheet, row + 1, 0);
    const firstName = cellText(worksheet, row + 1, 1);
    if (lastName.length >= 2 && firstName.length >= 2) {
      return { firstName, lastName };
    }

    throw new BadRequestException('Brak imienia i nazwiska w podkładzie (wiersz pod nagłówkami)');
  }

  throw new BadRequestException('Nie znaleziono nagłówków „nazwisko” i „imię” w podkładzie');
}

function extractYearMonth(
  worksheet: XLSX.WorkSheet,
  fileName: string,
): { year: number; month: number } {
  const title = cellText(worksheet, 0, 0);
  const fromTitle = parseTitleYearMonth(title);
  if (fromTitle) return fromTitle;

  const fromFileName = parseFileNameYearMonth(fileName);
  if (fromFileName) return fromFileName;

  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function parseTitleYearMonth(title: string): { year: number; month: number } | null {
  const match = title.trim().match(/^([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)\s+(20\d{2})$/u);
  if (!match) return null;

  const month = POLISH_MONTHS[normalizeMonthToken(match[1])];
  const year = Number(match[2]);
  if (!month || year < 2000 || year > 2100) return null;
  return { year, month };
}

function parseFileNameYearMonth(fileName: string): { year: number; month: number } | null {
  const base = fileName.replace(/\.(xlsx|xls)$/i, '');
  const patterns = [
    /(?:^|[^\d])(20\d{2})[-_.]([01]?\d{1,2})(?:[^\d]|$)/,
    /(?:^|[^\d])([01]?\d{1,2})[-_.](20\d{2})(?:[^\d]|$)/,
    /(?:^|[^\d])(20\d{2})([01]\d)(?:[^\d]|$)/,
    /(?:^|[^\d])01\.([01]?\d{1,2})-/,
  ];

  for (const pattern of patterns) {
    const match = base.match(pattern);
    if (!match) continue;

    if (pattern.source.includes('01\\.')) {
      const month = Number(match[1]);
      const yearMatch = base.match(/(20\d{2})/);
      const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
      if (month >= 1 && month <= 12) return { year, month };
      continue;
    }

    const year = Number(match[1].length === 4 ? match[1] : match[2]);
    const month = Number(match[1].length === 4 ? match[2] : match[1]);
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      return { year, month };
    }
  }

  return null;
}

function cellText(worksheet: XLSX.WorkSheet, row: number, col: number): string {
  const address = XLSX.utils.encode_cell({ r: row, c: col });
  const value = worksheet[address]?.v;
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function isLastNameHeader(value: string): boolean {
  return normalizeHeader(value) === 'nazwisko';
}

function isFirstNameHeader(value: string): boolean {
  return normalizeHeader(value).startsWith('imie');
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function normalizeMonthToken(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function assertExcelFile(fileName: string): void {
  const lower = fileName.toLowerCase();
  if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
    throw new BadRequestException('Obsługiwane formaty: .xlsx, .xls');
  }
}
