import { ApiProperty } from '@nestjs/swagger';

export class YearMonthQueryDto {
  @ApiProperty({ example: 2026, minimum: 2000, maximum: 2100 })
  year!: number;

  @ApiProperty({ example: 6, minimum: 1, maximum: 12 })
  month!: number;
}

export class WorkerPeriodQueryDto extends YearMonthQueryDto {
  @ApiProperty({ example: '1', description: 'Identyfikator pracownika (Supabase bigint jako string)' })
  workerId!: string;
}

export class WorkerDraftQueryDto extends WorkerPeriodQueryDto {
  @ApiProperty({
    example: '42',
    description: 'Identyfikator wiersza w Received_drafts. Opcjonalny przy pobieraniu, gdy jest jeden podkład.',
    required: false,
  })
  draftId?: string;
}
