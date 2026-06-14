import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ enum: ['connected', 'disconnected'], example: 'connected' })
  redis!: 'connected' | 'disconnected';
}
