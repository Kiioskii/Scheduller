import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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

import { SchedulesService } from './schedules.service';
import { SaveImportedSchedulesResultDto } from '../../swagger/dto/schedule.dto';
import { DraftSubmissionSummaryDto } from '../../swagger/dto/draft-submission-summary.dto';

@ApiTags('schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('draft-submissions/summary')
  @ApiOperation({ summary: 'Podsumowanie przesłanych podkładów za wybrany miesiąc' })
  @ApiQuery({ name: 'year', type: Number, example: 2026 })
  @ApiQuery({ name: 'month', type: Number, example: 6 })
  @ApiOkResponse({ type: DraftSubmissionSummaryDto })
  getDraftSubmissionSummary(
    @Query('year') yearParam: string,
    @Query('month') monthParam: string,
  ) {
    const year = Number(yearParam);
    const month = Number(monthParam);
    return this.schedulesService.getDraftSubmissionSummary(year, month);
  }

  @Get('template')
  @ApiOperation({ summary: 'Pobranie szablonu podkładu grafiku' })
  @ApiQuery({ name: 'year', type: Number, example: 2026 })
  @ApiQuery({ name: 'month', type: Number, example: 6 })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiOkResponse({ description: 'Plik Excel (.xlsx) ze szablonem podkładu' })
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
      .setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      .setHeader('Content-Disposition', contentDisposition)
      .send(buffer);
  }

  @Post('import/parse')
  @ApiOperation({ summary: 'Analiza plików grafików Excel (bez zapisu)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Pliki .xlsx lub .xls',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Sparsowane metadane plików grafików',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fileName: { type: 'string', example: 'grafik-czerwiec.xlsx' },
          year: { type: 'number', example: 2026 },
          month: { type: 'number', example: 6 },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 20))
  parseImport(@UploadedFiles() files?: Array<{ buffer: Buffer; originalname: string }>) {
    const uploads = (files ?? []).filter((file) => file.buffer?.length);
    if (uploads.length === 0) {
      throw new BadRequestException('Brak plików do importu');
    }
    return this.schedulesService.parseSchedulesFromFiles(uploads);
  }

  @Post('import')
  @ApiOperation({ summary: 'Zapis zaimportowanych grafików' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string' },
              year: { type: 'number' },
              month: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiOkResponse({ type: SaveImportedSchedulesResultDto })
  saveImport(@Body() body: unknown) {
    return this.schedulesService.saveImportedSchedules(body);
  }
}
