import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { CreateColumnDto, UpdateColumnDto } from './dto/create-column.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('projects/:id/columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Get()
  async list(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    const columns = await this.columnsService.listColumns(id, user.userId);
    return { data: columns, message: 'OK', error: null };
  }

  @Post()
  async create(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateColumnDto,
  ) {
    const col = await this.columnsService.createColumn(id, user.userId, dto.name, dto.position);
    return { data: col, message: 'Column created', error: null };
  }

  @Put(':cid')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Param('cid', ParseIntPipe) cid: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateColumnDto,
  ) {
    const col = await this.columnsService.updateColumn(id, cid, user.userId, dto);
    return { data: col, message: 'Column updated', error: null };
  }

  @Delete(':cid')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Param('cid', ParseIntPipe) cid: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.columnsService.deleteColumn(id, cid, user.userId);
    return { data: null, message: 'Column deleted', error: null };
  }
}
