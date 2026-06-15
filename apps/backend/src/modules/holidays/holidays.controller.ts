import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto, HolidayDto, UpdateHolidayDto } from '../../swagger/dto/holiday.dto';

@ApiTags('holidays')
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  @ApiOperation({ summary: 'Lista świąt dla wybranego roku' })
  @ApiQuery({ name: 'year', required: true, example: 2026, description: 'Rok kalendarzowy' })
  @ApiOkResponse({ type: HolidayDto, isArray: true })
  getAll(@Query('year') year: string) {
    return this.holidaysService.getHolidays(Number(year));
  }

  @Post()
  @ApiOperation({ summary: 'Dodanie święta (jeden dzień lub zakres kolejnych dni)' })
  @ApiBody({ type: CreateHolidayDto })
  @ApiOkResponse({ type: HolidayDto, isArray: true })
  create(@Body() body: unknown) {
    return this.holidaysService.createHolidays(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Aktualizacja święta' })
  @ApiParam({ name: 'id', example: '1', description: 'Identyfikator święta' })
  @ApiBody({ type: UpdateHolidayDto })
  @ApiOkResponse({ type: HolidayDto })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.holidaysService.updateHoliday(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Usunięcie święta' })
  @ApiParam({ name: 'id', example: '1', description: 'Identyfikator święta' })
  remove(@Param('id') id: string) {
    return this.holidaysService.deleteHoliday(id);
  }
}
