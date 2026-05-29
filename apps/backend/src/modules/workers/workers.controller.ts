import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { WorkersService } from './workers.service';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  getAll() {
    return this.workersService.getWorkers();
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
