import {
  BadRequestException,
  Body,
  Controller,
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

import { ReceivedSchedulesService } from './received-schedules.service';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly receivedSchedulesService: ReceivedSchedulesService,
  ) {}

  @Get('received')
  getReceivedStatuses(@Query('year') yearParam: string, @Query('month') monthParam: string) {
    const year = Number(yearParam);
    const month = Number(monthParam);
    return this.receivedSchedulesService.getWorkerPodkladStatuses(year, month);
  }

  @Post('drafts/submit')
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

  @Get('template')
  async downloadTemplate(
    @Query('year') yearParam: string,
    @Query('month') monthParam: string,
    @Res() res: Response,
  ) {
    const year = Number(yearParam);
    const month = Number(monthParam);
    const { buffer, contentDisposition } = await this.schedulesService.generatePodkladTemplate(
      year,
      month,
    );

    res
      .status(200)
      .setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .setHeader('Content-Disposition', contentDisposition)
      .send(buffer);
  }

  @Post('import/parse')
  @UseInterceptors(FilesInterceptor('files', 20))
  parseImport(@UploadedFiles() files?: Array<{ buffer: Buffer; originalname: string }>) {
    const uploads = (files ?? []).filter((file) => file.buffer?.length);
    if (uploads.length === 0) {
      throw new BadRequestException('Brak plików do importu');
    }
    return this.schedulesService.parseSchedulesFromFiles(uploads);
  }

  @Post('import')
  saveImport(@Body() body: unknown) {
    return this.schedulesService.saveImportedSchedules(body);
  }
}
