import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CanceledService } from './canceled.service';
import { UnarchiveCanceledCardDto } from './dto/unarchive-canceled-card.dto';

@Controller('projects/:id/canceled')
export class CanceledController {
  constructor(private readonly canceledService: CanceledService) {}

  @Get()
  async list(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const canceled = await this.canceledService.listProjectCanceled(id, user.userId);
    return { data: canceled, message: 'OK', error: null };
  }

  @Post('cards/:cardId')
  async cancelCard(
    @Param('id', ParseIntPipe) id: number,
    @Param('cardId', ParseIntPipe) cardId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const canceledCard = await this.canceledService.cancelCard(id, cardId, user.userId);
    return { data: canceledCard, message: 'Card canceled', error: null };
  }

  @Post('columns/:columnId')
  async cancelColumn(
    @Param('id', ParseIntPipe) id: number,
    @Param('columnId', ParseIntPipe) columnId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const canceledGroup = await this.canceledService.cancelColumn(id, columnId, user.userId);
    return { data: canceledGroup, message: 'Column canceled', error: null };
  }

  @Post('cards/:canceledCardId/unarchive')
  async unarchiveCard(
    @Param('id', ParseIntPipe) id: number,
    @Param('canceledCardId', ParseIntPipe) canceledCardId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UnarchiveCanceledCardDto,
  ) {
    const card = await this.canceledService.unarchiveCard(
      id,
      canceledCardId,
      dto.target_column_id,
      user.userId,
    );
    return { data: card, message: 'Card restored to board', error: null };
  }

  @Delete('cards/:canceledCardId')
  @HttpCode(HttpStatus.OK)
  async deleteCanceledCard(
    @Param('id', ParseIntPipe) id: number,
    @Param('canceledCardId', ParseIntPipe) canceledCardId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.canceledService.deleteCanceledCard(id, canceledCardId, user.userId);
    return { data: null, message: 'Canceled card deleted', error: null };
  }

  @Delete('groups/:groupId')
  @HttpCode(HttpStatus.OK)
  async deleteCanceledGroup(
    @Param('id', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.canceledService.deleteCanceledGroup(id, groupId, user.userId);
    return { data: null, message: 'Canceled column deleted', error: null };
  }
}
