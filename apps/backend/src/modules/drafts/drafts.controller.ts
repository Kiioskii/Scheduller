import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { DraftImportService } from './draft-import.service';
import { ReceivedSchedulesService } from './received-schedules.service';
import { buildPodkladContentDisposition } from '../schedules/schedule-podklad.content-disposition';

@Controller('drafts')
export class DraftsController {
  constructor(
    private readonly receivedSchedulesService: ReceivedSchedulesService,
    private readonly draftImportService: DraftImportService,
  ) {}

  @Get('received')
  getReceivedStatuses(@Query('year') yearParam: string, @Query('month') monthParam: string) {
    const year = Number(yearParam);
    const month = Number(monthParam);
    return this.receivedSchedulesService.getWorkerPodkladStatuses(year, month);
  }

  @Post('analyze')
  @UseInterceptors(FilesInterceptor('files', 50))
  analyzeDraftImports(
    @UploadedFiles() files?: Array<{ buffer: Buffer; originalname: string }>,
    @Query('year') yearParam?: string,
    @Query('month') monthParam?: string,
  ) {
    const uploads = (files ?? []).filter((file) => file.buffer?.length);
    if (uploads.length === 0) {
      throw new BadRequestException('Brak plików do analizy');
    }

    const year = Number(yearParam);
    const month = Number(monthParam);

    return this.draftImportService.analyzeDraftFiles(uploads, year, month);
  }

  @Post('confirm')
  @UseInterceptors(FilesInterceptor('files', 50))
  confirmDraftImports(
    @UploadedFiles() files?: Array<{ buffer: Buffer; originalname: string }>,
    @Body('payload') payloadJson?: string,
  ) {
    const uploads = (files ?? []).filter((file) => file.buffer?.length);
    if (uploads.length === 0) {
      throw new BadRequestException('Brak plików do zapisu');
    }
    if (!payloadJson?.trim()) {
      throw new BadRequestException('Brak danych przypisań');
    }

    let payload: unknown;
    try {
      payload = JSON.parse(payloadJson) as unknown;
    } catch {
      throw new BadRequestException('Nieprawidłowy format danych przypisań');
    }

    return this.draftImportService.confirmDraftImports(uploads, payload);
  }

  @Post('submit')
  @UseInterceptors(FileInterceptor('file'))
  submitWorkerDraft(
    @UploadedFile() file?: { buffer: Buffer; originalname: string },
    @Body('workerId') workerId?: string,
    @Body('year') yearParam?: string,
    @Body('month') monthParam?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Brak pliku do przesłania');
    }
    if (!workerId?.trim()) {
      throw new BadRequestException('Brak identyfikatora pracownika');
    }

    const year = Number(yearParam);
    const month = Number(monthParam);

    return this.receivedSchedulesService.submitWorkerDraft(workerId.trim(), year, month, {
      buffer: file.buffer,
      originalname: file.originalname,
    });
  }

  @Get('files')
  listWorkerDraftFiles(
    @Query('workerId') workerId: string,
    @Query('year') yearParam: string,
    @Query('month') monthParam: string,
  ) {
    if (!workerId?.trim()) {
      throw new BadRequestException('Brak identyfikatora pracownika');
    }

    const year = Number(yearParam);
    const month = Number(monthParam);

    return this.receivedSchedulesService.listWorkerDraftFiles(workerId.trim(), year, month);
  }

  @Get('file')
  async downloadWorkerDraft(
    @Query('workerId') workerId: string,
    @Query('year') yearParam: string,
    @Query('month') monthParam: string,
    @Query('draftId') draftId: string | undefined,
    @Res() res: Response,
  ) {
    if (!workerId?.trim()) {
      throw new BadRequestException('Brak identyfikatora pracownika');
    }

    const year = Number(yearParam);
    const month = Number(monthParam);
    const { buffer, contentType, fileName } = await this.receivedSchedulesService.downloadWorkerDraft(
      workerId.trim(),
      year,
      month,
      draftId?.trim() || undefined,
    );

    res
      .status(200)
      .setHeader('Content-Type', contentType)
      .setHeader('Content-Disposition', buildPodkladContentDisposition(fileName))
      .send(buffer);
  }

  @Delete('file')
  deleteWorkerDraft(
    @Query('workerId') workerId: string,
    @Query('year') yearParam: string,
    @Query('month') monthParam: string,
    @Query('draftId') draftId: string,
  ) {
    if (!workerId?.trim()) {
      throw new BadRequestException('Brak identyfikatora pracownika');
    }

    const year = Number(yearParam);
    const month = Number(monthParam);

    return this.receivedSchedulesService.deleteWorkerDraft(
      workerId.trim(),
      year,
      month,
      draftId,
    );
  }
}
