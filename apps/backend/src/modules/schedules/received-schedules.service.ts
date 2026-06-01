import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  submitWorkerDraftResultSchema,
  type SubmitWorkerDraftResult,
  type WorkerPodkladStatus,
} from '@scheduler/shared';

import { SupabaseService } from '../../supabase/supabase.service';
import { FilesService, type UploadFilePayload } from '../files/files.service';
import { WorkersService } from '../workers/workers.service';
import {
  isReceivedFlag,
  workerPodkladStatus,
  type ReceivedScheduleRow,
} from './received-schedules.mapper';
import type { WorkerRow } from '../workers/workers.mapper';

@Injectable()
export class ReceivedSchedulesService {
  /** Supabase table `Received_drafts`. */
  private static readonly TABLE = 'Received_drafts';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly workersService: WorkersService,
    private readonly filesService: FilesService,
  ) {}

  async getWorkerPodkladStatuses(year: number, month: number): Promise<WorkerPodkladStatus[]> {
    const { year: normalizedYear, month: normalizedMonth } = this.normalizeYearMonth(year, month);
    const [workers, receivedRows] = await Promise.all([
      this.workersService.getWorkers(),
      this.fetchReceivedRows(normalizedYear, normalizedMonth),
    ]);

    const receivedByWorkerId = new Map<string, boolean>();
    for (const row of receivedRows) {
      if (!isReceivedFlag(row.recived)) continue;
      receivedByWorkerId.set(String(row.worker_id), true);
    }

    const workerRows: WorkerRow[] = workers.map((worker) => ({
      id: worker.id,
      first_name: worker.firstName,
      last_name: worker.lastName,
      role: worker.role,
      priority: worker.priority,
      checker: worker.checker,
      deleted: worker.deleted,
    }));

    return workerRows.map((worker) => workerPodkladStatus(worker, receivedByWorkerId));
  }

  async submitWorkerDraft(
    workerId: string,
    year: number,
    month: number,
    file: UploadFilePayload,
  ): Promise<SubmitWorkerDraftResult> {
    const { year: normalizedYear, month: normalizedMonth } = this.normalizeYearMonth(year, month);

    const worker = await this.workersService.getWorkerById(workerId);
    if (worker.deleted) {
      throw new BadRequestException('Nie można przesłać podkładu dla nieaktywnego pracownika');
    }

    this.filesService.parseScheduleExcelFile(file);

    await this.markDraftReceived(worker.id, normalizedYear, normalizedMonth);

    return submitWorkerDraftResultSchema.parse({
      workerId: worker.id,
      year: normalizedYear,
      month: normalizedMonth,
      received: true,
    });
  }

  private async markDraftReceived(
    workerId: string,
    year: number,
    month: number,
  ): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const workerIdValue = this.toWorkerIdColumn(workerId);

    const { data: existing, error: selectError } = await supabase
      .from(ReceivedSchedulesService.TABLE)
      .select('worker_id')
      .eq('worker_id', workerIdValue)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();

    if (selectError) {
      throw new InternalServerErrorException(selectError.message);
    }

    if (existing) {
      const { error } = await supabase
        .from(ReceivedSchedulesService.TABLE)
        .update({ recived: 1 })
        .eq('worker_id', workerIdValue)
        .eq('year', year)
        .eq('month', month);

      if (error) {
        throw new InternalServerErrorException(error.message);
      }
      return;
    }

    const { error: insertError } = await supabase.from(ReceivedSchedulesService.TABLE).insert({
      worker_id: workerIdValue,
      year,
      month,
      recived: 1,
    });

    if (insertError) {
      throw new InternalServerErrorException(insertError.message);
    }
  }

  private toWorkerIdColumn(workerId: string): number | string {
    const asNumber = Number(workerId);
    return Number.isFinite(asNumber) ? asNumber : workerId;
  }

  private async fetchReceivedRows(year: number, month: number): Promise<ReceivedScheduleRow[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from(ReceivedSchedulesService.TABLE)
      .select('worker_id, year, month, recived')
      .eq('year', year)
      .eq('month', month);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []) as ReceivedScheduleRow[];
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
}
