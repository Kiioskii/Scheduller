import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { HolidaysController } from './holidays.controller';
import { HolidaysService } from './holidays.service';

@Module({
  imports: [SupabaseModule],
  providers: [HolidaysService],
  controllers: [HolidaysController],
  exports: [HolidaysService],
})
export class HolidaysModule {}
