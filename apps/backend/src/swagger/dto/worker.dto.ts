import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkerDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: 'Jan' })
  firstName!: string;

  @ApiProperty({ example: 'Kowalski' })
  lastName!: string;

  @ApiProperty({ enum: ['boss', 'worker'], example: 'worker' })
  role!: 'boss' | 'worker';

  @ApiProperty({ example: 5, minimum: 1, maximum: 10 })
  priority!: number;

  @ApiProperty({ example: false })
  checker!: boolean;

  @ApiProperty({ example: true })
  availableAsWorker!: boolean;

  @ApiProperty({ example: false })
  deleted!: boolean;
}

export class CreateWorkerDto {
  @ApiProperty({ example: 'Jan' })
  firstName!: string;

  @ApiProperty({ example: 'Kowalski' })
  lastName!: string;

  @ApiProperty({ enum: ['boss', 'worker'], example: 'worker' })
  role!: 'boss' | 'worker';

  @ApiProperty({ example: 5, minimum: 1, maximum: 10 })
  priority!: number;

  @ApiPropertyOptional({ example: false })
  checker?: boolean;

  @ApiPropertyOptional({ example: true })
  availableAsWorker?: boolean;
}

export class UpdateWorkerDto {
  @ApiPropertyOptional({ enum: ['boss', 'worker'] })
  role?: 'boss' | 'worker';

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  priority?: number;

  @ApiPropertyOptional()
  checker?: boolean;

  @ApiPropertyOptional()
  availableAsWorker?: boolean;

  @ApiPropertyOptional()
  deleted?: boolean;
}
