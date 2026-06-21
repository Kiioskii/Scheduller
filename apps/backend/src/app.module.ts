import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppGateway } from './app.gateway';
import { RedisModule } from './redis/redis.module';
import { SupabaseModule } from './supabase/supabase.module';
import { DraftsModule } from './modules/drafts/drafts.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { SchedulerEngineModule } from './scheduler-engine/scheduler-engine.module';
import { WorkersModule } from './modules/workers/workers.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { ShiftsModule } from './modules/shifts/shifts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.local',
        '.env',
        'apps/backend/.env.local',
        'apps/backend/.env',
      ],
    }),
    RedisModule,
    SchedulerEngineModule,
    SupabaseModule,
    WorkersModule,
    HolidaysModule,
    ShiftsModule,
    SchedulesModule,
    DraftsModule,
  ],
  controllers: [AppController],
  providers: [AppGateway],
})
export class AppModule {}
