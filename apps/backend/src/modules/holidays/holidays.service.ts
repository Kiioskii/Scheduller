import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  createHolidayInputSchema,
  updateHolidayInputSchema,
  type Holiday,
} from '@scheduler/shared';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  createInputToRows,
  rowToHoliday,
  updateInputToRow,
  type HolidayRow,
} from './holidays.mapper';

@Injectable()
export class HolidaysService {
  private static readonly TABLE = 'Holidays';

  constructor(private readonly supabaseService: SupabaseService) {}

  async getHolidays(year: number): Promise<Holiday[]> {
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      throw new BadRequestException('Nieprawidłowy rok');
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from(HolidaysService.TABLE)
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) {
      throw this.mapSupabaseError(error);
    }

    return (data as HolidayRow[]).map(rowToHoliday);
  }

  async createHolidays(body: unknown): Promise<Holiday[]> {
    const parsed = createHolidayInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const rows = createInputToRows(parsed.data);
    if (rows.length === 0) {
      throw new BadRequestException('Brak dat do zapisania');
    }

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from(HolidaysService.TABLE)
      .insert(rows)
      .select('*');

    if (error) {
      throw this.mapSupabaseError(error);
    }

    return (data as HolidayRow[]).map(rowToHoliday);
  }

  async updateHoliday(id: string, body: unknown): Promise<Holiday> {
    const parsed = updateHolidayInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const patch = updateInputToRow(parsed.data);
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    const supabase = this.supabaseService.getClient();

    if (parsed.data.start !== undefined || parsed.data.end !== undefined) {
      const { data: existing, error: fetchError } = await supabase
        .from(HolidaysService.TABLE)
        .select('start, end')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        throw this.mapSupabaseError(fetchError);
      }

      if (!existing) {
        throw new NotFoundException(`Holiday with id ${id} not found`);
      }

      const row = existing as Pick<HolidayRow, 'start' | 'end'>;
      const nextStart = parsed.data.start !== undefined ? parsed.data.start : row.start;
      const nextEnd = parsed.data.end !== undefined ? parsed.data.end : row.end;

      if (nextStart !== null && nextEnd !== null && nextStart >= nextEnd) {
        throw new BadRequestException('Godzina zamknięcia musi być późniejsza niż otwarcia');
      }
    }

    const { data, error } = await supabase
      .from(HolidaysService.TABLE)
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw this.mapSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException(`Holiday with id ${id} not found`);
    }

    return rowToHoliday(data as HolidayRow);
  }

  async deleteHoliday(id: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from(HolidaysService.TABLE)
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      throw this.mapSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException(`Holiday with id ${id} not found`);
    }
  }

  private mapSupabaseError(error: { code?: string; message: string }): Error {
    if (error.code === '23505') {
      return new BadRequestException('Święto dla tej daty już istnieje');
    }

    return new InternalServerErrorException(error.message);
  }
}
