import { Module } from '@nestjs/common';

import { FilesModule } from '../files/files.module';
import { HolidaysModule } from '../holidays/holidays.module';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [FilesModule, HolidaysModule],
  providers: [SchedulesService],
  controllers: [SchedulesController],
})
export class SchedulesModule {}
