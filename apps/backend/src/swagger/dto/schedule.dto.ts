import { ApiProperty } from '@nestjs/swagger';

export class SaveImportedSchedulesResultDto {
  @ApiProperty({ example: 2 })
  saved!: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        fileName: { type: 'string', example: 'grafik-czerwiec.xlsx' },
        year: { type: 'number', example: 2026 },
        month: { type: 'number', example: 6 },
      },
    },
  })
  files!: Array<{ fileName: string; year: number; month: number }>;
}
