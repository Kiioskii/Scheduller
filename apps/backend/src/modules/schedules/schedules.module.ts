import { Module } from '@nestjs/common';

import { FilesModule } from '../files/files.module';
import { WorkersModule } from '../workers/workers.module';
import { ReceivedSchedulesService } from './received-schedules.service';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [FilesModule, WorkersModule],
  providers: [SchedulesService, ReceivedSchedulesService],
  controllers: [SchedulesController],
})
export class SchedulesModule {}
