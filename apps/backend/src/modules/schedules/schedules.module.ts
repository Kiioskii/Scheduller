import { Module } from '@nestjs/common';

import { DraftsModule } from '../drafts/drafts.module';
import { FilesModule } from '../files/files.module';
import { HolidaysModule } from '../holidays/holidays.module';
import { ShiftsModule } from '../shifts/shifts.module';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [FilesModule, HolidaysModule, DraftsModule, ShiftsModule],
  providers: [SchedulesService],
  controllers: [SchedulesController],
})
export class SchedulesModule {}
