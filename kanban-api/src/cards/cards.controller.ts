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
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto, MoveCardDto } from './dto/create-card.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { ProjectAccessService } from '../projects/project-access.service';

@Controller()
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  // GET /api/projects/:id/cards
  @Get('projects/:id/cards')
  async listByProject(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    const cards = await this.cardsService.listCardsByProject(id, user.userId);
    return { data: cards, message: 'OK', error: null };
  }

  // GET /api/columns/:cid/cards
  @Get('columns/:cid/cards')
  async listByColumn(@Param('cid', ParseIntPipe) cid: number, @CurrentUser() user: JwtPayload) {
    const cards = await this.cardsService.listCards(cid, user.userId);
    return { data: cards, message: 'OK', error: null };
  }

  // POST /api/columns/:cid/cards
  @Post('columns/:cid/cards')
  async create(
    @Param('cid', ParseIntPipe) cid: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCardDto,
  ) {
    const projectId = await this.projectAccess.getProjectIdFromColumn(cid);
    await this.projectAccess.assertCanEditBoard(projectId, user.userId);
    const card = await this.cardsService.createCard(cid, user.userId, dto);
    return { data: card, message: 'Card created', error: null };
  }

  // GET /api/cards/:id
  @Get('cards/:id')
  async get(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    const card = await this.cardsService.getCard(id, user.userId);
    return { data: card, message: 'OK', error: null };
  }

  // PUT /api/cards/:id
  @Put('cards/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCardDto,
  ) {
    const projectId = await this.projectAccess.getProjectIdFromCard(id);
    await this.projectAccess.assertCanEditBoard(projectId, user.userId);
    const card = await this.cardsService.updateCard(id, user.userId, dto as Record<string, unknown>);
    return { data: card, message: 'Card updated', error: null };
  }

  // DELETE /api/cards/:id
  @Delete('cards/:id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    const projectId = await this.projectAccess.getProjectIdFromCard(id);
    await this.projectAccess.assertCanEditBoard(projectId, user.userId);
    await this.cardsService.deleteCard(id, user.userId);
    return { data: null, message: 'Card deleted', error: null };
  }

  // PUT /api/cards/:id/move
  @Put('cards/:id/move')
  async move(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: MoveCardDto,
  ) {
    const projectId = await this.projectAccess.getProjectIdFromCard(id);
    await this.projectAccess.assertCanEditBoard(projectId, user.userId);
    const card = await this.cardsService.moveCard(id, user.userId, dto.column_id, dto.position);
    return { data: card, message: 'Card moved', error: null };
  }
}
