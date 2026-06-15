import { BadRequestException, Injectable } from '@nestjs/common';
import {
  importedScheduleFileSchema,
  saveImportedSchedulesInputSchema,
  type ImportedScheduleFile,
} from '@scheduler/shared';

import { SchedulerEngineService } from '../../scheduler-engine/scheduler-engine.service';
import { FilesService, type UploadFilePayload } from '../files/files.service';
import { HolidaysService } from '../holidays/holidays.service';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly filesService: FilesService,
    private readonly schedulerEngine: SchedulerEngineService,
    private readonly holidaysService: HolidaysService,
  ) {}

  async generatePodkladTemplate(
    year: number,
    month: number,
  ): Promise<{ buffer: Buffer; fileName: string; contentDisposition: string }> {
    const normalized = this.normalizeYearMonth(year, month);
    const holidays = await this.holidaysService.getHolidays(normalized.year);
    const monthPrefix = `${normalized.year}-${String(normalized.month).padStart(2, '0')}`;
    const holidayDates = holidays
      .filter((holiday) => holiday.date.startsWith(monthPrefix))
      .map((holiday) => holiday.date);

    return this.schedulerEngine.fetchPodkladTemplate(
      normalized.year,
      normalized.month,
      holidayDates,
    );
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
