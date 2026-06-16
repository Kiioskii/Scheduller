import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import {
  CreateShiftTemplateDto,
  ShiftTemplateDto,
  UpdateShiftTemplateDto,
} from '../../swagger/dto/shift-template.dto';

@ApiTags('shifts')
@Controller('shift-templates')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista szablonów zmian' })
  @ApiOkResponse({ type: ShiftTemplateDto, isArray: true })
  getAll() {
    return this.shiftsService.getShiftTemplates();
  }

  @Post()
  @ApiOperation({ summary: 'Utworzenie szablonu zmian' })
  @ApiBody({ type: CreateShiftTemplateDto })
  @ApiOkResponse({ type: ShiftTemplateDto })
  create(@Body() body: unknown) {
    return this.shiftsService.createShiftTemplate(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Aktualizacja szablonu zmian' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ type: UpdateShiftTemplateDto })
  @ApiOkResponse({ type: ShiftTemplateDto })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.shiftsService.updateShiftTemplate(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Usunięcie szablonu zmian' })
  @ApiParam({ name: 'id', example: '1' })
  remove(@Param('id') id: string) {
    return this.shiftsService.deleteShiftTemplate(id);
  }
}
