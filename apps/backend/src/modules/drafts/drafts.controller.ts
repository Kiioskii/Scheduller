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
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { DraftImportService } from './draft-import.service';
import { ReceivedSchedulesService } from './received-schedules.service';
import { buildPodkladContentDisposition } from '../schedules/schedule-podklad.content-disposition';
import {
  ConfirmDraftImportsResultDto,
  DeleteWorkerDraftResultDto,
  SubmitWorkerDraftResultDto,
  WorkerDraftFilesResultDto,
  WorkerPodkladStatusDto,
} from '../../swagger/dto/draft.dto';

@ApiTags('drafts')
@Controller('drafts')
export class DraftsController {
  constructor(
    private readonly receivedSchedulesService: ReceivedSchedulesService,
    private readonly draftImportService: DraftImportService,
  ) {}

  @Get('received')
  @ApiOperation({ summary: 'Statusy przesłanych podkładów pracowników za wybrany miesiąc' })
  @ApiQuery({ name: 'year', type: Number, example: 2026 })
  @ApiQuery({ name: 'month', type: Number, example: 6 })
  @ApiOkResponse({ type: WorkerPodkladStatusDto, isArray: true })
  getReceivedStatuses(@Query('year') yearParam: string, @Query('month') monthParam: string) {
    const year = Number(yearParam);
    const month = Number(monthParam);
    return this.receivedSchedulesService.getWorkerPodkladStatuses(year, month);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analiza plików podkładów (dopasowanie do pracowników, bez zapisu)' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'year', type: Number, example: 2026 })
  @ApiQuery({ name: 'month', type: Number, example: 6 })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Pliki podkładów .xlsx lub .xls',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Wynik analizy: dopasowane, nierozpoznane podkłady i lista aktywnych pracowników',
  })
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
  @ApiOperation({ summary: 'Zapis podkładów po analizie i przypisaniu do pracowników' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files', 'payload'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        payload: {
          type: 'string',
          description: 'JSON z przypisaniami (ConfirmDraftImportsInput)',
          example: JSON.stringify({
            year: 2026,
            month: 6,
            assignments: [{ clientId: '0', kind: 'existing', workerId: '1' }],
          }),
        },
      },
    },
  })
  @ApiOkResponse({ type: ConfirmDraftImportsResultDto })
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
  @ApiOperation({ summary: 'Przesłanie pojedynczego podkładu przez pracownika' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'workerId', 'year', 'month'],
      properties: {
        file: { type: 'string', format: 'binary' },
        workerId: { type: 'string', example: '1' },
        year: { type: 'string', example: '2026' },
        month: { type: 'string', example: '6' },
      },
    },
  })
  @ApiOkResponse({ type: SubmitWorkerDraftResultDto })
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
  @ApiOperation({ summary: 'Lista podkładów pracownika za wybrany miesiąc' })
  @ApiQuery({ name: 'workerId', type: String, example: '1' })
  @ApiQuery({ name: 'year', type: Number, example: 2026 })
  @ApiQuery({ name: 'month', type: Number, example: 6 })
  @ApiOkResponse({ type: WorkerDraftFilesResultDto })
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
  @ApiOperation({ summary: 'Pobranie pliku podkładu' })
  @ApiQuery({ name: 'workerId', type: String, example: '1' })
  @ApiQuery({ name: 'year', type: Number, example: 2026 })
  @ApiQuery({ name: 'month', type: Number, example: 6 })
  @ApiQuery({
    name: 'draftId',
    type: String,
    required: false,
    description: 'Wymagany, gdy pracownik ma więcej niż jeden podkład',
  })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiOkResponse({ description: 'Plik Excel podkładu' })
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
  @ApiOperation({ summary: 'Usunięcie wybranego podkładu' })
  @ApiQuery({ name: 'workerId', type: String, example: '1' })
  @ApiQuery({ name: 'year', type: Number, example: 2026 })
  @ApiQuery({ name: 'month', type: Number, example: 6 })
  @ApiQuery({ name: 'draftId', type: String, example: '42' })
  @ApiOkResponse({ type: DeleteWorkerDraftResultDto })
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
