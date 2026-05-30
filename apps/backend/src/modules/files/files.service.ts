import { BadRequestException, Injectable } from '@nestjs/common';
import { createWorkerInputSchema, type CreateWorkerInput } from '@scheduler/shared';
import * as XLSX from 'xlsx';

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
