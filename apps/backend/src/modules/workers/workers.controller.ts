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
import { WorkersService } from './workers.service';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  getAll() {
    return this.workersService.getWorkers();
  }

  @Post('import/parse')
  @UseInterceptors(FileInterceptor('file'))
  parseImport(@UploadedFile() file?: { buffer: Buffer }) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Brak pliku do importu');
    }
    return this.workersService.parseWorkersFromFile(file.buffer);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.workersService.createWorker(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.workersService.updateWorker(id, body);
  }
}
