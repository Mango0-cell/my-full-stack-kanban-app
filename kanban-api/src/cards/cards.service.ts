import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Card, CardActivity } from '../entities';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { RolePolicyService } from '../common/policies/role-policy.service';

const UPDATE_FIELDS = new Set<keyof Card>([
  'title',
  'description',
  'due_date',
  'priority',
  'assigned_user_id',
]);

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardsRepo: Repository<Card>,
    @InjectRepository(CardActivity)
    private readonly activityRepo: Repository<CardActivity>,
    private readonly dataSource: DataSource,
    private readonly realtimeEvents: RealtimeEventsService,
    private readonly rolePolicy: RolePolicyService,
  ) {}

  private async logActivity(
    cardId: number,
    userId: number,
    actionType: string,
    oldValue: string | null = null,
    newValue: string | null = null,
  ) {
    const entity = this.activityRepo.create({
      card_id: cardId,
      user_id: userId,
      action_type: actionType,
      old_value: oldValue,
      new_value: newValue,
    });
    await this.activityRepo.save(entity);
  }

  async listCards(columnId: number, userId: number) {
    const projectId = await this.rolePolicy.getColumnProjectId(columnId);
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    return this.cardsRepo.find({
      where: { column_id: columnId },
      order: { position: 'ASC', card_id: 'ASC' },
    });
  }

  async listCardsByProject(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    return this.cardsRepo
      .createQueryBuilder('c')
      .innerJoin('c.column', 'col')
      .where('col.project_id = :projectId', { projectId })
      .orderBy('c.column_id', 'ASC')
      .addOrderBy('c.position', 'ASC')
      .addOrderBy('c.card_id', 'ASC')
      .getMany();
  }

  async createCard(
    columnId: number,
    userId: number,
    data: {
      title: string;
      description?: string;
      due_date?: string;
      priority?: string;
      assigned_user_id?: number;
      position?: number;
    },
  ) {
    const projectId = await this.rolePolicy.getColumnProjectId(columnId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    let pos = data.position;
    if (pos === undefined) {
      const row = await this.cardsRepo
        .createQueryBuilder('c')
        .select('COALESCE(MAX(c.position), -1) + 1', 'next_pos')
        .where('c.column_id = :columnId', { columnId })
        .getRawOne<{ next_pos: string | number }>();
      pos = Number(row?.next_pos ?? 0);
    }

    const entity = this.cardsRepo.create({
      column_id: columnId,
      created_by_user_id: userId,
      assigned_user_id: data.assigned_user_id ?? null,
      title: data.title,
      description: data.description ?? null,
      due_date: data.due_date ?? null,
      priority: data.priority ?? 'medium',
      position: pos,
    });
    const card = await this.cardsRepo.save(entity);
    await this.logActivity(card.card_id, userId, 'created', null, card.title);
    this.realtimeEvents.emitToProject(projectId, 'board.card.created', {
      project_id: projectId,
      card,
    });
    return card;
  }

  async getCard(cardId: number, userId: number) {
    const card = await this.cardsRepo.findOne({ where: { card_id: cardId } });
    if (!card) throw new NotFoundException('Card not found');
    const projectId = await this.rolePolicy.getColumnProjectId(card.column_id);
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    return card;
  }

  async updateCard(cardId: number, userId: number, updates: Record<string, unknown>) {
    const card = await this.cardsRepo.findOne({ where: { card_id: cardId } });
    if (!card) throw new NotFoundException('Card not found');

    const projectId = await this.rolePolicy.getColumnProjectId(card.column_id);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const patch: Partial<Card> = {};
    const activityLog: Array<{ action: string; old: string | null; new_: string | null }> = [];

    for (const key of Object.keys(updates)) {
      if (!UPDATE_FIELDS.has(key as keyof Card)) continue;
      const value = updates[key];
      (patch as Record<string, unknown>)[key] = value;

      if (key === 'title') {
        activityLog.push({ action: 'updated_title', old: card.title, new_: String(value) });
      } else if (key === 'description') {
        activityLog.push({
          action: 'updated_description',
          old: card.description,
          new_: String(value ?? ''),
        });
      } else if (key === 'priority') {
        activityLog.push({ action: 'priority_changed', old: card.priority, new_: String(value) });
      } else if (key === 'due_date') {
        activityLog.push({
          action: 'due_date_changed',
          old: card.due_date,
          new_: String(value ?? ''),
        });
      } else if (key === 'assigned_user_id') {
        if (value) {
          activityLog.push({
            action: 'assigned',
            old: card.assigned_user_id !== null ? String(card.assigned_user_id) : null,
            new_: String(value),
          });
        } else {
          activityLog.push({
            action: 'unassigned',
            old: card.assigned_user_id !== null ? String(card.assigned_user_id) : null,
            new_: null,
          });
        }
      }
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    Object.assign(card, patch);
    const saved = await this.cardsRepo.save(card);

    for (const log of activityLog) {
      await this.logActivity(cardId, userId, log.action, log.old, log.new_);
    }

    this.realtimeEvents.emitToProject(projectId, 'board.card.updated', {
      project_id: projectId,
      card_id: cardId,
      card: saved,
    });
    return saved;
  }

  async deleteCard(cardId: number, userId: number) {
    const card = await this.cardsRepo.findOne({ where: { card_id: cardId } });
    if (!card) throw new NotFoundException('Card not found');

    const projectId = await this.rolePolicy.getColumnProjectId(card.column_id);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    await this.logActivity(cardId, userId, 'deleted', card.title, null);
    await this.cardsRepo.delete(cardId);

    this.realtimeEvents.emitToProject(projectId, 'board.card.deleted', {
      project_id: projectId,
      card_id: cardId,
    });
  }

  async moveCard(cardId: number, userId: number, targetColumnId: number, position: number) {
    const card = await this.cardsRepo.findOne({ where: { card_id: cardId } });
    if (!card) throw new NotFoundException('Card not found');

    const srcProjectId = await this.rolePolicy.getColumnProjectId(card.column_id);
    await this.rolePolicy.assertProjectBoardWrite(srcProjectId, userId);

    const destProjectId = await this.rolePolicy.getColumnProjectId(targetColumnId);
    if (srcProjectId !== destProjectId) {
      throw new ForbiddenException('Cannot move card to a column in a different project');
    }

    const oldValue = `column:${card.column_id},pos:${card.position}`;
    const newValue = `column:${targetColumnId},pos:${position}`;

    const movedCard = await this.dataSource.transaction(async (manager) => {
      const srcColumnId = card.column_id;
      const oldPosition = card.position;
      const sameColumn = srcColumnId === targetColumnId;

      if (sameColumn) {
        if (oldPosition < position) {
          await manager
            .createQueryBuilder()
            .update(Card)
            .set({ position: () => 'position - 1' })
            .where(
              'column_id = :col AND position > :oldPos AND position <= :newPos AND card_id != :cardId',
              { col: srcColumnId, oldPos: oldPosition, newPos: position, cardId },
            )
            .execute();
        } else if (oldPosition > position) {
          await manager
            .createQueryBuilder()
            .update(Card)
            .set({ position: () => 'position + 1' })
            .where(
              'column_id = :col AND position >= :newPos AND position < :oldPos AND card_id != :cardId',
              { col: srcColumnId, newPos: position, oldPos: oldPosition, cardId },
            )
            .execute();
        }
      } else {
        // Close gap in source column
        await manager
          .createQueryBuilder()
          .update(Card)
          .set({ position: () => 'position - 1' })
          .where('column_id = :col AND position > :oldPos AND card_id != :cardId', {
            col: srcColumnId,
            oldPos: oldPosition,
            cardId,
          })
          .execute();
        // Open gap in destination column
        await manager
          .createQueryBuilder()
          .update(Card)
          .set({ position: () => 'position + 1' })
          .where('column_id = :col AND position >= :newPos AND card_id != :cardId', {
            col: targetColumnId,
            newPos: position,
            cardId,
          })
          .execute();
      }

      // Place the card at target position
      await manager.update(Card, { card_id: cardId }, {
        column_id: targetColumnId,
        position,
      });
      const updated = await manager.findOne(Card, { where: { card_id: cardId } });
      if (!updated) throw new NotFoundException('Card not found after move');
      return updated;
    });

    await this.logActivity(cardId, userId, 'moved', oldValue, newValue);
    this.realtimeEvents.emitToProject(srcProjectId, 'board.card.moved', {
      project_id: srcProjectId,
      card_id: cardId,
      card: movedCard,
    });
    return movedCard;
  }
}
