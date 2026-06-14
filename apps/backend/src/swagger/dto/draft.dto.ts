import { ApiProperty } from '@nestjs/swagger';

export class WorkerPodkladStatusDto {
  @ApiProperty({ example: '1' })
  workerId!: string;

  @ApiProperty({ example: 'Jan' })
  firstName!: string;

  @ApiProperty({ example: 'Kowalski' })
  lastName!: string;

  @ApiProperty({ enum: ['boss', 'worker'], example: 'worker' })
  role!: 'boss' | 'worker';

  @ApiProperty({ example: false })
  deleted!: boolean;

  @ApiProperty({ example: true })
  received!: boolean;

  @ApiProperty({ example: 1, minimum: 0 })
  draftCount!: number;
}

export class WorkerDraftFileDto {
  @ApiProperty({ example: '42' })
  id!: string;

  @ApiProperty({ example: 'PODKŁAD 01.06-30.06 R (2).xlsx' })
  fileName!: string;

  @ApiProperty({ example: '2026-06-01T10:15:00.000Z' })
  createdAt!: string;
}

export class WorkerDraftFilesResultDto {
  @ApiProperty({ type: [WorkerDraftFileDto] })
  drafts!: WorkerDraftFileDto[];
}

export class SubmitWorkerDraftResultDto {
  @ApiProperty({ example: '1' })
  workerId!: string;

  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 6 })
  month!: number;

  @ApiProperty({ example: true })
  received!: boolean;
}

export class DeleteWorkerDraftResultDto {
  @ApiProperty({ example: '42' })
  deletedDraftId!: string;

  @ApiProperty({ example: 0, minimum: 0 })
  remainingDraftCount!: number;
}

export class ConfirmDraftImportsResultDto {
  @ApiProperty({ example: 3 })
  saved!: number;

  @ApiProperty({ type: [String], example: ['1', '2', '3'] })
  workerIds!: string[];
}
