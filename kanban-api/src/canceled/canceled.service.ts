import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import {
  BoardColumn,
  CanceledCard,
  CanceledColumnGroup,
  Card,
  CardActivity,
} from '../entities';
import { RolePolicyService } from '../common/policies/role-policy.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

@Injectable()
export class CanceledService {
  constructor(
    @InjectRepository(CanceledCard)
    private readonly canceledCardsRepo: Repository<CanceledCard>,
    @InjectRepository(CanceledColumnGroup)
    private readonly canceledGroupsRepo: Repository<CanceledColumnGroup>,
    @InjectRepository(Card)
    private readonly cardsRepo: Repository<Card>,
    @InjectRepository(BoardColumn)
    private readonly columnsRepo: Repository<BoardColumn>,
    private readonly dataSource: DataSource,
    private readonly rolePolicy: RolePolicyService,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {}

  async listProjectCanceled(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectReadable(projectId, userId);

    const groups = await this.canceledGroupsRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.cards', 'c')
      .where('g.project_id = :projectId', { projectId })
      .orderBy('g.canceled_at', 'DESC')
      .addOrderBy('c.canceled_card_id', 'ASC')
      .getMany();

    const entries = groups.map((g) => ({
      canceled_group_id: g.canceled_group_id,
      column_name: g.column_name,
      canceled_at: g.canceled_at,
      cards: (g.cards ?? []).map((c) => ({
        canceled_card_id: c.canceled_card_id,
        title: c.title,
        description: c.description,
        due_date: c.due_date,
        priority: c.priority,
        assigned_user_id: c.assigned_user_id,
        original_column_name: c.original_column_name ?? g.column_name,
        canceled_at: c.canceled_at,
      })),
    }));

    const orphan_cards = await this.canceledCardsRepo.find({
      where: { project_id: projectId, canceled_group_id: IsNull() },
      order: { canceled_at: 'DESC', canceled_card_id: 'DESC' },
      select: {
        canceled_card_id: true,
        title: true,
        description: true,
        due_date: true,
        priority: true,
        assigned_user_id: true,
        original_column_name: true,
        canceled_at: true,
      },
    });

    return { entries, orphan_cards };
  }

  async cancelCard(projectId: number, cardId: number, userId: number) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const card = await this.cardsRepo
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.column', 'col')
      .where('c.card_id = :cardId', { cardId })
      .getOne();

    if (!card) throw new NotFoundException('Card not found');
    if (card.column.project_id !== projectId) {
      throw new NotFoundException('Card not found in this project');
    }

    const canceledCard = await this.dataSource.transaction(async (manager) => {
      const cc = manager.create(CanceledCard, {
        project_id: projectId,
        canceled_group_id: null,
        created_by_user_id: card.created_by_user_id,
        assigned_user_id: card.assigned_user_id,
        title: card.title,
        description: card.description,
        due_date: card.due_date,
        priority: card.priority ?? 'medium',
        original_column_name: card.column.name,
        canceled_by_user_id: userId,
      });
      const saved = await manager.save(cc);

      const activity = manager.create(CardActivity, {
        card_id: cardId,
        user_id: userId,
        action_type: 'canceled',
        old_value: card.title,
        new_value: null,
      });
      await manager.save(activity);

      await manager.delete(Card, { card_id: cardId });
      return saved;
    });

    this.realtimeEvents.emitToProject(projectId, 'board.card.deleted', {
      project_id: projectId,
      card_id: cardId,
    });
    this.realtimeEvents.emitToProject(projectId, 'board.canceled.card.canceled', {
      project_id: projectId,
      card_id: cardId,
      canceled_card_id: canceledCard.canceled_card_id,
    });
    this.realtimeEvents.emitToProject(projectId, 'board.canceled.updated', {
      project_id: projectId,
    });

    return canceledCard;
  }

  async cancelColumn(projectId: number, columnId: number, userId: number) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const column = await this.columnsRepo.findOne({
      where: { column_id: columnId, project_id: projectId },
    });
    if (!column) throw new NotFoundException('Column not found');

    const cards = await this.cardsRepo.find({
      where: { column_id: columnId },
      order: { position: 'ASC', card_id: 'ASC' },
    });

    const group = await this.dataSource.transaction(async (manager) => {
      const groupEntity = manager.create(CanceledColumnGroup, {
        project_id: projectId,
        column_name: column.name,
        canceled_by_user_id: userId,
      });
      const savedGroup = await manager.save(groupEntity);

      for (const card of cards) {
        const cc = manager.create(CanceledCard, {
          project_id: projectId,
          canceled_group_id: savedGroup.canceled_group_id,
          created_by_user_id: card.created_by_user_id,
          assigned_user_id: card.assigned_user_id,
          title: card.title,
          description: card.description,
          due_date: card.due_date,
          priority: card.priority ?? 'medium',
          original_column_name: column.name,
          canceled_by_user_id: userId,
        });
        await manager.save(cc);
      }

      await manager.delete(BoardColumn, { column_id: columnId, project_id: projectId });
      return savedGroup;
    });

    this.realtimeEvents.emitToProject(projectId, 'board.column.deleted', {
      project_id: projectId,
      column_id: columnId,
    });
    this.realtimeEvents.emitToProject(projectId, 'board.canceled.column.canceled', {
      project_id: projectId,
      column_id: columnId,
      canceled_group_id: group.canceled_group_id,
      cards_count: cards.length,
    });
    this.realtimeEvents.emitToProject(projectId, 'board.canceled.updated', {
      project_id: projectId,
    });

    return { ...group, cards_count: cards.length };
  }

  async unarchiveCard(
    projectId: number,
    canceledCardId: number,
    targetColumnId: number,
    userId: number,
  ) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const targetColumn = await this.columnsRepo.findOne({
      where: { column_id: targetColumnId },
      select: { project_id: true },
    });
    if (!targetColumn || targetColumn.project_id !== projectId) {
      throw new ForbiddenException('Target column does not belong to this project');
    }

    const card = await this.dataSource.transaction(async (manager) => {
      const canceledCard = await manager
        .createQueryBuilder(CanceledCard, 'cc')
        .where('cc.canceled_card_id = :id AND cc.project_id = :projectId', {
          id: canceledCardId,
          projectId,
        })
        .setLock('pessimistic_write')
        .getOne();

      if (!canceledCard) throw new NotFoundException('Canceled card not found');

      const posRow = await manager
        .createQueryBuilder(Card, 'c')
        .select('COALESCE(MAX(c.position), -1) + 1', 'next_pos')
        .where('c.column_id = :col', { col: targetColumnId })
        .getRawOne<{ next_pos: string | number }>();
      const nextPos = Number(posRow?.next_pos ?? 0);

      const newCard = manager.create(Card, {
        column_id: targetColumnId,
        created_by_user_id: canceledCard.created_by_user_id,
        assigned_user_id: canceledCard.assigned_user_id,
        title: canceledCard.title,
        description: canceledCard.description,
        due_date: canceledCard.due_date,
        priority: canceledCard.priority,
        position: nextPos,
      });
      const savedCard = await manager.save(newCard);

      await manager.delete(CanceledCard, {
        canceled_card_id: canceledCardId,
        project_id: projectId,
      });

      if (canceledCard.canceled_group_id) {
        const remaining = await manager.count(CanceledCard, {
          where: { canceled_group_id: canceledCard.canceled_group_id },
        });
        if (remaining === 0) {
          await manager.delete(CanceledColumnGroup, {
            canceled_group_id: canceledCard.canceled_group_id,
            project_id: projectId,
          });
        }
      }

      return savedCard;
    });

    this.realtimeEvents.emitToProject(projectId, 'board.card.created', {
      project_id: projectId,
      card,
    });
    this.realtimeEvents.emitToProject(projectId, 'board.canceled.card.unarchived', {
      project_id: projectId,
      canceled_card_id: canceledCardId,
      card_id: card.card_id,
    });
    this.realtimeEvents.emitToProject(projectId, 'board.canceled.updated', {
      project_id: projectId,
    });

    return card;
  }

  async deleteCanceledCard(projectId: number, canceledCardId: number, userId: number) {
    // Viewers are read-only — they may see the canceled list but cannot
    // mutate it. Owner / admin / editor / member can delete entries.
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(CanceledCard, {
        where: { canceled_card_id: canceledCardId, project_id: projectId },
        // Include PK in select so TypeORM hydrates the row reliably.
        select: { canceled_card_id: true, canceled_group_id: true },
      });
      if (!existing) throw new NotFoundException('Canceled card not found');

      await manager.delete(CanceledCard, {
        canceled_card_id: canceledCardId,
        project_id: projectId,
      });

      if (existing.canceled_group_id) {
        const remaining = await manager.count(CanceledCard, {
          where: { canceled_group_id: existing.canceled_group_id },
        });
        if (remaining === 0) {
          await manager.delete(CanceledColumnGroup, {
            canceled_group_id: existing.canceled_group_id,
            project_id: projectId,
          });
        }
      }
    });

    this.realtimeEvents.emitToProject(projectId, 'board.canceled.card.deleted', {
      project_id: projectId,
      canceled_card_id: canceledCardId,
    });
    this.realtimeEvents.emitToProject(projectId, 'board.canceled.updated', {
      project_id: projectId,
    });
  }

  async deleteCanceledGroup(projectId: number, canceledGroupId: number, userId: number) {
    // Viewers are read-only — same policy as deleteCanceledCard.
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const result = await this.canceledGroupsRepo.delete({
      canceled_group_id: canceledGroupId,
      project_id: projectId,
    });
    if (!result.affected) throw new NotFoundException('Canceled column group not found');

    this.realtimeEvents.emitToProject(projectId, 'board.canceled.group.deleted', {
      project_id: projectId,
      canceled_group_id: canceledGroupId,
    });
    this.realtimeEvents.emitToProject(projectId, 'board.canceled.updated', {
      project_id: projectId,
    });
  }
}
