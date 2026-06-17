import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  deleteWorkerDraftResultSchema,
  submitWorkerDraftResultSchema,
  workerDraftFileSchema,
  workerDraftFilesResultSchema,
  type DeleteWorkerDraftResult,
  type SubmitWorkerDraftResult,
  type WorkerDraftFile,
  type WorkerDraftFilesResult,
  type WorkerPodkladStatus,
} from '@scheduler/shared';

import { SupabaseService } from '../../supabase/supabase.service';
import { parsePodkladDraftFile } from '../files/podklad-draft.parser';
import type { UploadFilePayload } from '../files/files.service';
import { WorkersService } from '../workers/workers.service';
import { DraftStorageService } from './draft-storage.service';
import {
  buildWorkerDraftDownloadFileName,
  isReceivedFlag,
  workerPodkladStatus,
  type ReceivedDraftRow,
} from './received-schedules.mapper';
import type { WorkerRow } from '../workers/workers.mapper';

@Injectable()
export class ReceivedSchedulesService {
  /** Supabase table `Received_drafts`. */
  private static readonly TABLE = 'Received_drafts';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly workersService: WorkersService,
    private readonly draftStorageService: DraftStorageService,
  ) {}

  async getWorkerPodkladStatuses(year: number, month: number): Promise<WorkerPodkladStatus[]> {
    const { year: normalizedYear, month: normalizedMonth } = this.normalizeYearMonth(year, month);
    const [workers, receivedRows] = await Promise.all([
      this.workersService.getWorkers(),
      this.fetchReceivedRows(normalizedYear, normalizedMonth),
    ]);

    const draftCountByWorkerId = new Map<string, number>();
    for (const row of receivedRows) {
      if (!isReceivedFlag(row.recived)) continue;
      const workerId = String(row.worker_id);
      draftCountByWorkerId.set(workerId, (draftCountByWorkerId.get(workerId) ?? 0) + 1);
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

    return workerRows.map((worker) => workerPodkladStatus(worker, draftCountByWorkerId));
  }

  async getDraftSubmissionSummary(
    year: number,
    month: number,
  ): Promise<{
    year: number;
    month: number;
    activeWorkers: number;
    submittedCount: number;
  }> {
    const { year: normalizedYear, month: normalizedMonth } = this.normalizeYearMonth(year, month);
    const statuses = await this.getWorkerPodkladStatuses(normalizedYear, normalizedMonth);
    const activeWorkers = statuses.filter((worker) => !worker.deleted);
    const submittedCount = activeWorkers.filter((worker) => worker.received).length;

    return {
      year: normalizedYear,
      month: normalizedMonth,
      activeWorkers: activeWorkers.length,
      submittedCount,
    };
  }

  async listWorkerDraftFiles(
    workerId: string,
    year: number,
    month: number,
  ): Promise<WorkerDraftFilesResult> {
    const { year: normalizedYear, month: normalizedMonth } = this.normalizeYearMonth(year, month);
    await this.workersService.getWorkerById(workerId);

    const rows = await this.fetchWorkerDraftRows(workerId, normalizedYear, normalizedMonth);
    const drafts = rows.map((row) => this.toWorkerDraftFile(row));

    return workerDraftFilesResultSchema.parse({ drafts });
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

    parsePodkladDraftFile(file.originalname, file.buffer, 'single');

    await this.saveWorkerDraft(worker.id, normalizedYear, normalizedMonth, file);

    return submitWorkerDraftResultSchema.parse({
      workerId: worker.id,
      year: normalizedYear,
      month: normalizedMonth,
      received: true,
    });
  }

  async saveWorkerDraft(
    workerId: string,
    year: number,
    month: number,
    file: UploadFilePayload,
  ): Promise<void> {
    const { year: normalizedYear, month: normalizedMonth } = this.normalizeYearMonth(year, month);
    const storedDraft = await this.draftStorageService.uploadWorkerDraft(
      workerId,
      normalizedYear,
      normalizedMonth,
      file,
    );
    await this.insertReceivedDraftRow({
      workerId,
      year: normalizedYear,
      month: normalizedMonth,
      fileName: storedDraft.fileName,
      storagePath: storedDraft.storagePath,
    });
  }

  async downloadWorkerDraft(
    workerId: string,
    year: number,
    month: number,
    draftId?: string,
  ): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
    const { year: normalizedYear, month: normalizedMonth } = this.normalizeYearMonth(year, month);
    const resolvedDraftId = await this.resolveDraftIdForDownload(
      workerId,
      normalizedYear,
      normalizedMonth,
      draftId,
    );

    const row = await this.fetchWorkerDraftRow(
      workerId,
      normalizedYear,
      normalizedMonth,
      resolvedDraftId,
    );
    if (!row) {
      throw new NotFoundException('Nie znaleziono podkładu');
    }

    const worker = await this.workersService.getWorkerById(workerId);
    const { buffer, contentType } = await this.draftStorageService.downloadWorkerDraftFile(
      row.storage_path,
      row.file_name,
    );

    return {
      buffer,
      contentType,
      fileName: buildWorkerDraftDownloadFileName(
        worker.firstName,
        worker.lastName,
        normalizedYear,
        normalizedMonth,
        row.file_name,
      ),
    };
  }

  async deleteWorkerDraft(
    workerId: string,
    year: number,
    month: number,
    draftId: string,
  ): Promise<DeleteWorkerDraftResult> {
    if (!draftId?.trim()) {
      throw new BadRequestException('Brak identyfikatora podkładu');
    }

    const { year: normalizedYear, month: normalizedMonth } = this.normalizeYearMonth(year, month);
    await this.workersService.getWorkerById(workerId);

    const row = await this.fetchWorkerDraftRow(
      workerId,
      normalizedYear,
      normalizedMonth,
      draftId.trim(),
    );
    if (!row) {
      throw new NotFoundException('Nie znaleziono podkładu');
    }

    await this.draftStorageService.deleteWorkerDraftFile(row.storage_path);
    await this.deleteReceivedDraftRow(draftId.trim());

    const remainingDraftCount = await this.countWorkerDrafts(
      workerId,
      normalizedYear,
      normalizedMonth,
    );

    return deleteWorkerDraftResultSchema.parse({
      deletedDraftId: draftId.trim(),
      remainingDraftCount,
    });
  }

  assertYearMonth(year: number, month: number): { year: number; month: number } {
    return this.normalizeYearMonth(year, month);
  }

  async downloadAllMonthDraftFiles(
    year: number,
    month: number,
  ): Promise<
    Array<{
      draftId: string;
      workerId: string;
      fileName: string;
      buffer: Buffer;
    }>
  > {
    const { year: normalizedYear, month: normalizedMonth } = this.normalizeYearMonth(year, month);
    const rows = await this.fetchReceivedRows(normalizedYear, normalizedMonth);

    const receivedRows = rows.filter(
      (row) => isReceivedFlag(row.recived) && row.storage_path?.trim(),
    );

    return Promise.all(
      receivedRows.map(async (row) => {
        const { buffer } = await this.draftStorageService.downloadWorkerDraftFile(
          row.storage_path,
          row.file_name,
        );

        return {
          draftId: String(row.id),
          workerId: String(row.worker_id),
          fileName: row.file_name,
          buffer,
        };
      }),
    );
  }

  private async resolveDraftIdForDownload(
    workerId: string,
    year: number,
    month: number,
    draftId?: string,
  ): Promise<string> {
    if (draftId?.trim()) {
      return draftId.trim();
    }

    const { drafts } = await this.listWorkerDraftFiles(workerId, year, month);
    if (drafts.length === 0) {
      throw new BadRequestException('Pracownik nie przesłał jeszcze podkładu za ten miesiąc');
    }
    if (drafts.length > 1) {
      throw new BadRequestException('Wybierz podkład z listy');
    }

    return drafts[0]!.id;
  }

  private async countWorkerDrafts(workerId: string, year: number, month: number): Promise<number> {
    const rows = await this.fetchWorkerDraftRows(workerId, year, month);
    return rows.length;
  }

  private toWorkerDraftFile(row: ReceivedDraftRow): WorkerDraftFile {
    return workerDraftFileSchema.parse({
      id: String(row.id),
      fileName: row.file_name,
      createdAt: row.created_at,
    });
  }

  private async insertReceivedDraftRow(params: {
    workerId: string;
    year: number;
    month: number;
    fileName: string;
    storagePath: string;
  }): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const workerIdValue = this.toWorkerIdColumn(params.workerId);

    const { error } = await supabase.from(ReceivedSchedulesService.TABLE).insert({
      worker_id: workerIdValue,
      year: params.year,
      month: params.month,
      recived: true,
      file_name: params.fileName,
      storage_path: params.storagePath,
    });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async deleteReceivedDraftRow(draftId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const draftIdValue = this.toDraftIdColumn(draftId);

    const { error } = await supabase
      .from(ReceivedSchedulesService.TABLE)
      .delete()
      .eq('id', draftIdValue);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async fetchWorkerDraftRow(
    workerId: string,
    year: number,
    month: number,
    draftId: string,
  ): Promise<ReceivedDraftRow | null> {
    const supabase = this.supabaseService.getClient();
    const workerIdValue = this.toWorkerIdColumn(workerId);
    const draftIdValue = this.toDraftIdColumn(draftId);

    const { data, error } = await supabase
      .from(ReceivedSchedulesService.TABLE)
      .select(
        'id, worker_id, year, month, recived, created_at, storage_path, file_name',
      )
      .eq('worker_id', workerIdValue)
      .eq('year', year)
      .eq('month', month)
      .eq('id', draftIdValue)
      .eq('recived', true)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data as ReceivedDraftRow | null) ?? null;
  }

  private async fetchWorkerDraftRows(
    workerId: string,
    year: number,
    month: number,
  ): Promise<ReceivedDraftRow[]> {
    const supabase = this.supabaseService.getClient();
    const workerIdValue = this.toWorkerIdColumn(workerId);

    const { data, error } = await supabase
      .from(ReceivedSchedulesService.TABLE)
      .select(
        'id, worker_id, year, month, recived, created_at, storage_path, file_name',
      )
      .eq('worker_id', workerIdValue)
      .eq('year', year)
      .eq('month', month)
      .eq('recived', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []) as ReceivedDraftRow[];
  }

  private async fetchReceivedRows(year: number, month: number): Promise<ReceivedDraftRow[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from(ReceivedSchedulesService.TABLE)
      .select('id, worker_id, year, month, recived, created_at, storage_path, file_name')
      .eq('year', year)
      .eq('month', month);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []) as ReceivedDraftRow[];
  }

  private toWorkerIdColumn(workerId: string): number | string {
    const asNumber = Number(workerId);
    return Number.isFinite(asNumber) ? asNumber : workerId;
  }

  private toDraftIdColumn(draftId: string): number | string {
    const asNumber = Number(draftId);
    return Number.isFinite(asNumber) ? asNumber : draftId;
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
