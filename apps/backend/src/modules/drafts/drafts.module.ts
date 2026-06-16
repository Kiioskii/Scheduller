import { Module } from '@nestjs/common';

import { WorkersModule } from '../workers/workers.module';
import { DraftImportService } from './draft-import.service';
import { DraftStorageService } from './draft-storage.service';
import { DraftsController } from './drafts.controller';
import { ReceivedSchedulesService } from './received-schedules.service';

@Module({
  imports: [WorkersModule],
  providers: [ReceivedSchedulesService, DraftStorageService, DraftImportService],
  controllers: [DraftsController],
  exports: [ReceivedSchedulesService],
})
export class DraftsModule {}
