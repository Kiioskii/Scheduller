import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { WorkersService } from './workers.service';
import { WorkersController } from './workers.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [SupabaseModule, FilesModule],
  providers: [WorkersService],
  controllers: [WorkersController],
})
export class WorkersModule {}
