import { Global, Module } from '@nestjs/common';

import { SchedulerEngineService } from './scheduler-engine.service';

@Global()
@Module({
  providers: [SchedulerEngineService],
  exports: [SchedulerEngineService],
})
export class SchedulerEngineModule {}
