import { BadRequestException, Injectable } from '@nestjs/common';
import {
  analyzeDraftsResultSchema,
  confirmDraftImportsInputSchema,
  confirmDraftImportsResultSchema,
  type AnalyzeDraftsResult,
  type AnalyzedDraft,
  type ConfirmDraftImportsInput,
  type ConfirmDraftImportsResult,
  type MatchedDraft,
} from '@scheduler/shared';

import type { UploadFilePayload } from '../files/files.service';
import { parsePodkladDraftFile } from '../files/podklad-draft.parser';
import { WorkersService } from '../workers/workers.service';
import { findWorkerByDraftName } from './worker-name.matcher';
import { ReceivedSchedulesService } from './received-schedules.service';

@Injectable()
export class DraftImportService {
  constructor(
    private readonly workersService: WorkersService,
    private readonly receivedSchedulesService: ReceivedSchedulesService,
  ) {}

  async analyzeDraftFiles(
    files: UploadFilePayload[],
    expectedYear: number,
    expectedMonth: number,
  ): Promise<AnalyzeDraftsResult> {
    this.receivedSchedulesService.assertYearMonth(expectedYear, expectedMonth);

    if (files.length === 0) {
      throw new BadRequestException('Brak plików do analizy');
    }

    const parsedDrafts = this.parseDraftFiles(files);
    const workers = await this.workersService.getWorkers();
    const activeWorkers = workers.filter((worker) => !worker.deleted);

    const matched: MatchedDraft[] = [];
    const unmatched: AnalyzedDraft[] = [];
    const usedWorkerIds = new Set<string>();

    for (const draft of parsedDrafts) {
      if (draft.year !== expectedYear || draft.month !== expectedMonth) {
        throw new BadRequestException(
          `Plik „${draft.fileName}” dotyczy ${draft.month}/${draft.year}, a wybrany miesiąc to ${expectedMonth}/${expectedYear}`,
        );
      }

      const worker = findWorkerByDraftName(draft, activeWorkers);

      if (worker && !usedWorkerIds.has(worker.id)) {
        usedWorkerIds.add(worker.id);
        matched.push({
          draft,
          worker: {
            id: worker.id,
            firstName: worker.firstName,
            lastName: worker.lastName,
            role: worker.role,
          },
        });
        continue;
      }

      unmatched.push(draft);
    }

    return analyzeDraftsResultSchema.parse({
      matched,
      unmatched,
      activeWorkers: activeWorkers.map((worker) => ({
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        role: worker.role,
      })),
    });
  }

  async confirmDraftImports(
    files: UploadFilePayload[],
    body: unknown,
  ): Promise<ConfirmDraftImportsResult> {
    const parsed = confirmDraftImportsInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const input = parsed.data;
    this.receivedSchedulesService.assertYearMonth(input.year, input.month);

    const filesByClientId = this.indexFilesByClientId(files, input.assignments.length);
    const workerIds: string[] = [];

    for (const assignment of input.assignments) {
      const file = filesByClientId.get(assignment.clientId);
      if (!file) {
        throw new BadRequestException(`Brak pliku dla identyfikatora ${assignment.clientId}`);
      }

      parsePodkladDraftFile(file.originalname, file.buffer, assignment.clientId);

      let workerId: string;
      if (assignment.kind === 'existing') {
        const worker = await this.workersService.getWorkerById(assignment.workerId);
        if (worker.deleted) {
          throw new BadRequestException(
            `Nie można przypisać podkładu do nieaktywnego pracownika (${worker.firstName} ${worker.lastName})`,
          );
        }
        workerId = worker.id;
      } else {
        const created = await this.workersService.createWorker(assignment.worker);
        workerId = created.id;
      }

      await this.receivedSchedulesService.saveWorkerDraft(
        workerId,
        input.year,
        input.month,
        file,
      );
      workerIds.push(workerId);
    }

    return confirmDraftImportsResultSchema.parse({
      saved: workerIds.length,
      workerIds,
    });
  }

  private parseDraftFiles(files: UploadFilePayload[]): AnalyzedDraft[] {
    const parsed: AnalyzedDraft[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      const clientId = String(index);
      try {
        parsed.push(parsePodkladDraftFile(file.originalname, file.buffer, clientId));
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
        message: 'Błędy w plikach podkładów',
        errors,
      });
    }

    return parsed;
  }

  private indexFilesByClientId(
    files: UploadFilePayload[],
    expectedCount: number,
  ): Map<string, UploadFilePayload> {
    if (files.length !== expectedCount) {
      throw new BadRequestException('Liczba plików nie zgadza się z przypisaniami');
    }

    const map = new Map<string, UploadFilePayload>();
    files.forEach((file, index) => {
      map.set(String(index), file);
    });
    return map;
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
}
