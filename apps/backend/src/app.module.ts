import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppGateway } from './app.gateway';
import { RedisModule } from './redis/redis.module';
import { SupabaseModule } from './supabase/supabase.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { SchedulerEngineModule } from './scheduler-engine/scheduler-engine.module';
import { WorkersModule } from './modules/workers/workers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    RedisModule,
    SchedulerEngineModule,
    SupabaseModule,
    WorkersModule,
    SchedulesModule,
  ],
  controllers: [AppController],
  providers: [AppGateway],
})
export class AppModule {}
