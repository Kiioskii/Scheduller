import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShiftDefinitionDto {
  @ApiProperty({ enum: ['boss', 'worker'], example: 'worker' })
  role!: 'boss' | 'worker';

  @ApiProperty({ example: 2, description: 'Wymagana liczba pracowników' })
  requiredWorkers!: number;

  @ApiProperty({ example: '08:00', description: 'Godzina rozpoczęcia (GG:MM)' })
  start!: string;

  @ApiProperty({ example: '16:30', description: 'Godzina zakończenia (GG:MM)' })
  end!: string;

  @ApiProperty({
    type: [String],
    example: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    description: 'Dni tygodnia, w które występuje zmiana',
  })
  weekdays!: string[];
}

export class ShiftTemplateDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: 'Zmiany standardowe' })
  name!: string;

  @ApiProperty({ type: ShiftDefinitionDto, isArray: true })
  shifts!: ShiftDefinitionDto[];

  @ApiProperty({ example: '2026-06-15T12:00:00.000Z' })
  createdAt!: string;
}

export class CreateShiftTemplateDto {
  @ApiProperty({ example: 'Zmiany standardowe' })
  name!: string;

  @ApiProperty({ type: ShiftDefinitionDto, isArray: true })
  shifts!: ShiftDefinitionDto[];
}

export class UpdateShiftTemplateDto {
  @ApiPropertyOptional({ example: 'Zmiany standardowe' })
  name?: string;

  @ApiPropertyOptional({ type: ShiftDefinitionDto, isArray: true })
  shifts?: ShiftDefinitionDto[];
}
