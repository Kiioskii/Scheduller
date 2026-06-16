import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  createShiftTemplateInputSchema,
  updateShiftTemplateInputSchema,
  type ShiftTemplate,
} from '@scheduler/shared';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  createInputToRow,
  rowToShiftTemplate,
  updateInputToRow,
  type ShiftTemplateRow,
} from './shifts.mapper';

@Injectable()
export class ShiftsService {
  private static readonly TABLE = 'Shift_templates';

  constructor(private readonly supabaseService: SupabaseService) {}

  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from(ShiftsService.TABLE).select('*').order('name');

    if (error) {
      console.log('error: ', error);
      throw new InternalServerErrorException(error.message);
    }

    return (data as ShiftTemplateRow[]).map(rowToShiftTemplate);
  }

  async createShiftTemplate(body: unknown): Promise<ShiftTemplate> {
    const parsed = createShiftTemplateInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from(ShiftsService.TABLE)
      .insert(createInputToRow(parsed.data))
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return rowToShiftTemplate(data as ShiftTemplateRow);
  }

  async updateShiftTemplate(id: string, body: unknown): Promise<ShiftTemplate> {
    const parsed = updateShiftTemplateInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const patch = updateInputToRow(parsed.data);
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from(ShiftsService.TABLE)
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Shift template with id ${id} not found`);
    }

    return rowToShiftTemplate(data as ShiftTemplateRow);
  }

  async deleteShiftTemplate(id: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from(ShiftsService.TABLE)
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Shift template with id ${id} not found`);
    }
  }
}
