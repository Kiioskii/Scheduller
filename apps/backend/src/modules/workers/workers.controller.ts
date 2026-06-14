import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { WorkersService } from './workers.service';
import { CreateWorkerDto, UpdateWorkerDto, WorkerDto } from '../../swagger/dto/worker.dto';

@ApiTags('workers')
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista wszystkich pracowników' })
  @ApiOkResponse({ type: WorkerDto, isArray: true })
  getAll() {
    return this.workersService.getWorkers();
  }

  @Post('import/parse')
  @ApiOperation({ summary: 'Analiza pliku Excel z listą pracowników (bez zapisu)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Plik .xlsx lub .xls' },
      },
    },
  })
  @ApiOkResponse({ type: CreateWorkerDto, isArray: true })
  @UseInterceptors(FileInterceptor('file'))
  parseImport(@UploadedFile() file?: { buffer: Buffer }) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Brak pliku do importu');
    }
    return this.workersService.parseWorkersFromFile(file.buffer);
  }

  @Post()
  @ApiOperation({ summary: 'Dodanie nowego pracownika' })
  @ApiBody({ type: CreateWorkerDto })
  @ApiOkResponse({ type: WorkerDto })
  create(@Body() body: unknown) {
    return this.workersService.createWorker(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Aktualizacja pracownika' })
  @ApiParam({ name: 'id', example: '1', description: 'Identyfikator pracownika' })
  @ApiBody({ type: UpdateWorkerDto })
  @ApiOkResponse({ type: WorkerDto })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.workersService.updateWorker(id, body);
  }
}
