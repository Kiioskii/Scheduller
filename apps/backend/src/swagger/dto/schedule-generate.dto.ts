import { ApiProperty } from '@nestjs/swagger';

export class GenerateScheduleResultDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  jobId!: string;

  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 6 })
  month!: number;

  @ApiProperty({ example: 'accepted', enum: ['accepted', 'failed'] })
  status!: 'accepted' | 'failed';

  @ApiProperty({ example: 42 })
  draftCount!: number;

  @ApiProperty({ example: 2 })
  holidayCount!: number;

  @ApiProperty({ example: 120 })
  assignmentCount!: number;

  @ApiProperty({ example: 502 })
  totalSlotCount!: number;

  @ApiProperty({ example: 'optimal', enum: ['optimal', 'feasible', 'infeasible'] })
  solverStatus!: 'optimal' | 'feasible' | 'infeasible';

  @ApiProperty({ example: 'Schedule generated successfully' })
  message!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  preview!: Record<string, unknown>;

  @ApiProperty({ type: [String], example: [] })
  unassignedSlotIds!: string[];
}
