import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HolidayDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: '2026-06-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: 'Boże Narodzenie', nullable: true })
  name!: string | null;

  @ApiProperty({ example: '2026-12-25' })
  date!: string;

  @ApiProperty({ example: 8, nullable: true, description: 'Godzina otwarcia obiektu (0–24)' })
  start!: number | null;

  @ApiProperty({ example: 14, nullable: true, description: 'Godzina zamknięcia obiektu (0–24)' })
  end!: number | null;
}

export class CreateHolidayDto {
  @ApiPropertyOptional({ example: 'Boże Narodzenie', nullable: true })
  name?: string | null;

  @ApiProperty({ example: '2026-12-25', description: 'Data początkowa (lub jedyny dzień święta)' })
  startDate!: string;

  @ApiPropertyOptional({
    example: '2026-12-26',
    description: 'Data końcowa — opcjonalna; jeśli pominięta, dodawany jest jeden dzień',
  })
  endDate?: string;

  @ApiPropertyOptional({ example: 8, nullable: true, description: 'Godzina otwarcia obiektu (0–24)' })
  start?: number | null;

  @ApiPropertyOptional({ example: 14, nullable: true, description: 'Godzina zamknięcia obiektu (0–24)' })
  end?: number | null;
}

export class UpdateHolidayDto {
  @ApiPropertyOptional({ example: 'Boże Narodzenie', nullable: true })
  name?: string | null;

  @ApiPropertyOptional({ example: '2026-12-25' })
  date?: string;

  @ApiPropertyOptional({ example: 8, nullable: true, description: 'Godzina otwarcia obiektu (0–24)' })
  start?: number | null;

  @ApiPropertyOptional({ example: 14, nullable: true, description: 'Godzina zamknięcia obiektu (0–24)' })
  end?: number | null;
}
