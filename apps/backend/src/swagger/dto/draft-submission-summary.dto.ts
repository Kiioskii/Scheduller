import { ApiProperty } from '@nestjs/swagger';

export class DraftSubmissionSummaryDto {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 6, minimum: 1, maximum: 12 })
  month!: number;

  @ApiProperty({ example: 12, description: 'Liczba aktywnych pracowników' })
  activeWorkers!: number;

  @ApiProperty({ example: 8, description: 'Liczba pracowników, którzy przesłali podkład' })
  submittedCount!: number;
}
