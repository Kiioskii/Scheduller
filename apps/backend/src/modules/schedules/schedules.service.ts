import { BadRequestException, Injectable } from '@nestjs/common';
import {
  draftSubmissionSummarySchema,
  generateScheduleInputSchema,
  generateScheduleResultSchema,
  importedScheduleFileSchema,
  saveImportedSchedulesInputSchema,
  type DraftSubmissionSummary,
  type GenerateScheduleResult,
  type Holiday,
  type ImportedScheduleFile,
  type ShiftTemplate,
} from '@scheduler/shared';

import { ReceivedSchedulesService } from '../drafts/received-schedules.service';
import { SchedulerEngineService } from '../../scheduler-engine/scheduler-engine.service';
import type { GenerateScheduleEngineRequest } from '../../scheduler-engine/scheduler-engine.types';
import { FilesService, type UploadFilePayload } from '../files/files.service';
import { HolidaysService } from '../holidays/holidays.service';
import { ShiftsService } from '../shifts/shifts.service';
import { WorkersService } from '../workers/workers.service';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly filesService: FilesService,
    private readonly schedulerEngine: SchedulerEngineService,
    private readonly holidaysService: HolidaysService,
    private readonly receivedSchedulesService: ReceivedSchedulesService,
    private readonly shiftsService: ShiftsService,
    private readonly workersService: WorkersService,
  ) {}

  async getDraftSubmissionSummary(year: number, month: number): Promise<DraftSubmissionSummary> {
    const normalized = this.normalizeYearMonth(year, month);
    const summary = await this.receivedSchedulesService.getDraftSubmissionSummary(
      normalized.year,
      normalized.month,
    );
    return draftSubmissionSummarySchema.parse(summary);
  }

  async generateSchedule(body: unknown): Promise<GenerateScheduleResult> {
    const parsed = generateScheduleInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const { year, month, dayAssignments } = parsed.data;
    const normalized = this.normalizeYearMonth(year, month);

    const [workerDrafts, holidays, shiftTemplates, workers] = await Promise.all([
      this.receivedSchedulesService.downloadAllMonthDraftFiles(normalized.year, normalized.month),
      this.getHolidaysForMonth(normalized.year, normalized.month),
      this.getShiftTemplatesForAssignments(dayAssignments),
      this.workersService.getWorkers(),
    ]);

    const enginePayload: GenerateScheduleEngineRequest = {
      year: normalized.year,
      month: normalized.month,
      dayAssignments,
      holidays,
      shiftTemplates,
      workers: workers.filter((worker) => !worker.deleted),
      workerDrafts: workerDrafts.map((draft) => ({
        draftId: draft.draftId,
        workerId: draft.workerId,
        fileName: draft.fileName,
        contentBase64: draft.buffer.toString('base64'),
      })),
    };

    const engineResult = await this.schedulerEngine.generateSchedule(enginePayload);

    return generateScheduleResultSchema.parse({
      jobId: engineResult.jobId,
      year: normalized.year,
      month: normalized.month,
      status: 'accepted',
      draftCount: workerDrafts.length,
      holidayCount: holidays.length,
    });
  }

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

  private async getHolidaysForMonth(year: number, month: number): Promise<Holiday[]> {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const holidays = await this.holidaysService.getHolidays(year);
    return holidays.filter((holiday) => holiday.date.startsWith(monthPrefix));
  }

  private async getShiftTemplatesForAssignments(
    dayAssignments: Array<{ shiftTemplateId: string }>,
  ): Promise<ShiftTemplate[]> {
    const requiredIds = new Set(dayAssignments.map((assignment) => assignment.shiftTemplateId));
    const templates = await this.shiftsService.getShiftTemplates();
    const selected = templates.filter((template) => requiredIds.has(template.id));

    const missingIds = [...requiredIds].filter(
      (id) => !selected.some((template) => template.id === id),
    );
    if (missingIds.length > 0) {
      throw new BadRequestException(`Nie znaleziono szablonów zmian: ${missingIds.join(', ')}`);
    }

    return selected;
  }
}
