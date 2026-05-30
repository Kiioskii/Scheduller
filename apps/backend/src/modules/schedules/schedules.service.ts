import { BadRequestException, Injectable } from '@nestjs/common';
import {
  importedScheduleFileSchema,
  saveImportedSchedulesInputSchema,
  type ImportedScheduleFile,
} from '@scheduler/shared';

import { FilesService, type UploadFilePayload } from '../files/files.service';
import {
  formatPodkladFileName,
  generateSchedulePodkladBuffer,
} from './schedule-podklad.generator';

@Injectable()
export class SchedulesService {
  constructor(private readonly filesService: FilesService) {}

  generatePodkladTemplate(year: number, month: number): { buffer: Buffer; fileName: string } {
    const normalized = this.normalizeYearMonth(year, month);
    return {
      buffer: generateSchedulePodkladBuffer(normalized.year, normalized.month),
      fileName: formatPodkladFileName(normalized.year, normalized.month),
    };
  }

  private normalizeYearMonth(year: number, month: number): { year: number; month: number } {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('Nieprawidłowy rok');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Nieprawidłowy miesiąc');
    }
    return { year, month };
  }

  parseSchedulesFromFiles(files: UploadFilePayload[]): ImportedScheduleFile[] {
    return this.filesService.parseScheduleExcelFiles(files);
  }

  saveImportedSchedules(body: unknown): { saved: number; files: ImportedScheduleFile[] } {
    const parsed = saveImportedSchedulesInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const files = parsed.data.files.map((file) => importedScheduleFileSchema.parse(file));

    return {
      saved: files.length,
      files,
    };
  }
}
