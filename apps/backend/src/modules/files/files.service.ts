import { BadRequestException, Injectable } from '@nestjs/common';
import {
  createWorkerInputSchema,
  importedScheduleFileSchema,
  type CreateWorkerInput,
  type ImportedScheduleFile,
} from '@scheduler/shared';
import * as XLSX from 'xlsx';

const EXCEL_EXTENSIONS = ['.xlsx', '.xls'] as const;

export type UploadFilePayload = {
  buffer: Buffer;
  originalname: string;
};

const COL_FIRST_NAME = 'Imię';
const COL_LAST_NAME = 'Nazwisko';
const COL_PRIORITY = 'Priorytet';

const DEFAULT_PRIORITY = 5;
const DEFAULT_ROLE = 'worker' as const;
const DEFAULT_CHECKER = true;

@Injectable()
export class FilesService {
  /**
   * Parses the first sheet of an Excel (.xlsx, .xls) or CSV file and returns workers ready to create.
   * Expected columns: "Imię", "Nazwisko", optional "Priorytet".
   */
  parseWorkersFile(fileBuffer: Buffer): CreateWorkerInput[] {
    if (!fileBuffer?.length) {
      throw new BadRequestException('Plik jest pusty');
    }

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new BadRequestException('Plik nie zawiera arkusza');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    });

    if (rows.length === 0) {
      throw new BadRequestException('Plik nie zawiera wierszy danych');
    }

    const workers: CreateWorkerInput[] = [];
    const errors: string[] = [];

    rows.forEach((rawRow, index) => {
      const row = this.normalizeRow(rawRow);
      const firstName = row[COL_FIRST_NAME] ?? '';
      const lastName = row[COL_LAST_NAME] ?? '';

      if (!firstName && !lastName) {
        return;
      }

      const rowNum = index + 2;
      if (!firstName || !lastName) {
        errors.push(`Wiersz ${rowNum}: wymagane kolumny „Imię” i „Nazwisko”`);
        return;
      }

      const parsed = createWorkerInputSchema.safeParse({
        firstName,
        lastName,
        role: DEFAULT_ROLE,
        priority: this.parsePriority(row[COL_PRIORITY]),
        checker: DEFAULT_CHECKER,
      });

      if (!parsed.success) {
        const msg = parsed.error.issues.map((issue) => issue.message).join(', ');
        errors.push(`Wiersz ${rowNum}: ${msg}`);
        return;
      }

      workers.push(parsed.data);
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Błędy w pliku importu',
        errors,
      });
    }

    if (workers.length === 0) {
      throw new BadRequestException('Nie znaleziono pracowników w pliku');
    }

    return workers;
  }

  private normalizeRow(row: Record<string, unknown>): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[String(key).trim()] = String(value ?? '').trim();
    }
    return normalized;
  }

  parseScheduleExcelFiles(files: UploadFilePayload[]): ImportedScheduleFile[] {
    if (files.length === 0) {
      throw new BadRequestException('Brak plików do importu');
    }

    const parsed: ImportedScheduleFile[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      try {
        parsed.push(this.parseScheduleExcelFile(file));
      } catch (error) {
        const message =
          error instanceof BadRequestException
            ? this.formatBadRequestMessage(error)
            : 'Nie udało się odczytać pliku';
        errors.push(`${file.originalname}: ${message}`);
      }
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Błędy w plikach importu',
        errors,
      });
    }

    return parsed;
  }

  parseScheduleExcelFile(file: UploadFilePayload): ImportedScheduleFile {
    this.assertExcelFile(file.originalname);

    if (!file.buffer?.length) {
      throw new BadRequestException('Plik jest pusty');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new BadRequestException('Plik nie zawiera arkusza');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    });

    const { year, month } = this.inferYearMonth(file.originalname);
    const draft = {
      fileName: file.originalname,
      sheetName,
      sheetNames: workbook.SheetNames,
      rowCount: rows.length,
      year,
      month,
    };

    const parsed = importedScheduleFileSchema.safeParse(draft);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((issue) => issue.message).join(', ');
      throw new BadRequestException(msg);
    }

    return parsed.data;
  }

  private assertExcelFile(fileName: string): void {
    const lower = fileName.toLowerCase();
    const accepted = EXCEL_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!accepted) {
      throw new BadRequestException('Obsługiwane formaty: .xlsx, .xls');
    }
  }

  private inferYearMonth(fileName: string): { year: number; month: number } {
    const base = fileName.replace(/\.(xlsx|xls)$/i, '');
    const patterns = [
      /(?:^|[^\d])(20\d{2})[-_.]([01]?\d{1,2})(?:[^\d]|$)/,
      /(?:^|[^\d])([01]?\d{1,2})[-_.](20\d{2})(?:[^\d]|$)/,
      /(?:^|[^\d])(20\d{2})([01]\d)(?:[^\d]|$)/,
    ];

    for (const pattern of patterns) {
      const match = base.match(pattern);
      if (!match) continue;

      const year = Number(match[1].length === 4 ? match[1] : match[2]);
      const month = Number(match[1].length === 4 ? match[2] : match[1]);
      if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        return { year, month };
      }
    }

    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  private formatBadRequestMessage(error: BadRequestException): string {
    const response = error.getResponse();
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && response !== null && 'message' in response) {
      const { message } = response as { message: unknown };
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.map(String).join(', ');
    }
    return 'Nieprawidłowy plik';
  }

  private parsePriority(value: string | undefined): number {
    if (value === undefined || value === '') {
      return DEFAULT_PRIORITY;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_PRIORITY;
    }
    return Math.trunc(parsed);
  }
}
