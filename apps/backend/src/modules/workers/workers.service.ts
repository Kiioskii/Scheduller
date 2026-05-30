import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  createWorkerInputSchema,
  updateWorkerInputSchema,
  type CreateWorkerInput,
  type Worker,
} from '@scheduler/shared';
import { FilesService } from '../files/files.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { createInputToRow, rowToWorker, updateInputToRow, type WorkerRow } from './workers.mapper';

@Injectable()
export class WorkersService {
  private static readonly TABLE = 'Workers';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly filesService: FilesService,
  ) {}

  parseWorkersFromFile(fileBuffer: Buffer): CreateWorkerInput[] {
    return this.filesService.parseWorkersFile(fileBuffer);
  }

  async getWorkers(): Promise<Worker[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from(WorkersService.TABLE)
      .select('*')
      .order('last_name')
      .order('first_name');

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data as WorkerRow[]).map(rowToWorker);
  }

  async createWorker(body: unknown): Promise<Worker> {
    const parsed = createWorkerInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from(WorkersService.TABLE)
      .insert(createInputToRow(parsed.data))
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return rowToWorker(data as WorkerRow);
  }

  async updateWorker(id: string, body: unknown): Promise<Worker> {
    const parsed = updateWorkerInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const patch = updateInputToRow(parsed.data);
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from(WorkersService.TABLE)
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Worker with id ${id} not found`);
    }

    return rowToWorker(data as WorkerRow);
  }
}
