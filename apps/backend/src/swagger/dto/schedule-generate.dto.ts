import { ApiProperty } from '@nestjs/swagger';

export class GenerateScheduleResultDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  jobId!: string;

  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 6 })
  month!: number;

  @ApiProperty({ example: 'accepted', enum: ['accepted'] })
  status!: 'accepted';

  @ApiProperty({ example: 42 })
  draftCount!: number;

  @ApiProperty({ example: 2 })
  holidayCount!: number;
}
