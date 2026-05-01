import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RolePolicyService } from '../common/policies/role-policy.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

interface CanceledGroupRow {
  canceled_group_id: number;
  column_name: string;
  canceled_at: string;
  canceled_card_id: number | null;
  title: string | null;
  description: string | null;
  due_date: string | null;
  priority: string | null;
  assigned_user_id: number | null;
  original_column_name: string | null;
  card_canceled_at: string | null;
}

@Injectable()
export class CanceledService {
  constructor(
    private readonly db: DatabaseService,
    private readonly rolePolicy: RolePolicyService,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {}

  async listProjectCanceled(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectReadable(projectId, userId);

    const { rows: groupRows } = await this.db.query(
      `SELECT
         g.canceled_group_id,
         g.column_name,
         g.canceled_at,
         c.canceled_card_id,
         c.title,
         c.description,
         c.due_date,
         c.priority,
         c.assigned_user_id,
         c.original_column_name,
         c.canceled_at AS card_canceled_at
       FROM canceled_column_groups g
       LEFT JOIN canceled_cards c ON c.canceled_group_id = g.canceled_group_id
       WHERE g.project_id = $1
       ORDER BY g.canceled_at DESC, c.canceled_card_id ASC`,
      [projectId],
    );

    const grouped = new Map<number, {
      canceled_group_id: number;
      column_name: string;
      canceled_at: string;
      cards: Array<{
        canceled_card_id: number;
        title: string;
        description: string | null;
        due_date: string | null;
        priority: string;
        assigned_user_id: number | null;
        original_column_name: string;
        canceled_at: string;
      }>;
    }>();

    for (const row of groupRows as CanceledGroupRow[]) {
      if (!grouped.has(row.canceled_group_id)) {
        grouped.set(row.canceled_group_id, {
          canceled_group_id: row.canceled_group_id,
          column_name: row.column_name,
          canceled_at: row.canceled_at,
          cards: [],
        });
      }
      if (row.canceled_card_id) {
        grouped.get(row.canceled_group_id)!.cards.push({
          canceled_card_id: row.canceled_card_id,
          title: row.title ?? '',
          description: row.description,
          due_date: row.due_date,
          priority: row.priority ?? 'medium',
          assigned_user_id: row.assigned_user_id,
          original_column_name: row.original_column_name ?? row.column_name,
          canceled_at: row.card_canceled_at ?? row.canceled_at,
        });
      }
    }

    const { rows: orphanRows } = await this.db.query(
      `SELECT
         canceled_card_id,
         title,
         description,
         due_date,
         priority,
         assigned_user_id,
         original_column_name,
         canceled_at
       FROM canceled_cards
       WHERE project_id = $1 AND canceled_group_id IS NULL
       ORDER BY canceled_at DESC, canceled_card_id DESC`,
      [projectId],
    );

    return {
      entries: Array.from(grouped.values()),
      orphan_cards: orphanRows,
    };
  }

  async cancelCard(projectId: number, cardId: number, userId: number) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const { rows: cardRows } = await this.db.query(
      `SELECT
         c.card_id,
         c.column_id,
         c.created_by_user_id,
         c.assigned_user_id,
         c.title,
         c.description,
         c.due_date,
         c.priority,
         col.project_id,
         col.name AS column_name
       FROM cards c
       JOIN columns col ON col.column_id = c.column_id
       WHERE c.card_id = $1`,
      [cardId],
    );

    if (cardRows.length === 0) {
      throw new NotFoundException('Card not found');
    }

    const card = cardRows[0];
    if (card.project_id !== projectId) {
      throw new NotFoundException('Card not found in this project');
    }

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const { rows: canceledRows } = await client.query(
        `INSERT INTO canceled_cards (
           project_id,
           canceled_group_id,
           created_by_user_id,
           assigned_user_id,
           title,
           description,
           due_date,
           priority,
           original_column_name,
           canceled_by_user_id
         ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          projectId,
          card.created_by_user_id,
          card.assigned_user_id,
          card.title,
          card.description,
          card.due_date,
          card.priority ?? 'medium',
          card.column_name,
          userId,
        ],
      );

      await client.query(
        `INSERT INTO card_activity (card_id, user_id, action_type, old_value, new_value)
         VALUES ($1, $2, 'canceled', $3, NULL)`,
        [cardId, userId, card.title],
      );

      await client.query('DELETE FROM cards WHERE card_id = $1', [cardId]);

      await client.query('COMMIT');

      this.realtimeEvents.emitToProject(projectId, 'board.card.deleted', {
        project_id: projectId,
        card_id: cardId,
      });
      this.realtimeEvents.emitToProject(projectId, 'board.canceled.card.canceled', {
        project_id: projectId,
        card_id: cardId,
        canceled_card_id: canceledRows[0].canceled_card_id,
      });
      this.realtimeEvents.emitToProject(projectId, 'board.canceled.updated', {
        project_id: projectId,
      });

      return canceledRows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async cancelColumn(projectId: number, columnId: number, userId: number) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const { rows: columnRows } = await this.db.query(
      `SELECT column_id, project_id, name
       FROM columns
       WHERE column_id = $1 AND project_id = $2`,
      [columnId, projectId],
    );

    if (columnRows.length === 0) {
      throw new NotFoundException('Column not found');
    }

    const column = columnRows[0];

    const { rows: cards } = await this.db.query(
      `SELECT
         card_id,
         created_by_user_id,
         assigned_user_id,
         title,
         description,
         due_date,
         priority
       FROM cards
       WHERE column_id = $1
       ORDER BY position, card_id`,
      [columnId],
    );

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const { rows: groupRows } = await client.query(
        `INSERT INTO canceled_column_groups (project_id, column_name, canceled_by_user_id)
         VALUES ($1, $2, $3)
         RETURNING canceled_group_id, project_id, column_name, canceled_at`,
        [projectId, column.name, userId],
      );
      const group = groupRows[0];

      for (const card of cards) {
        await client.query(
          `INSERT INTO canceled_cards (
             project_id,
             canceled_group_id,
             created_by_user_id,
             assigned_user_id,
             title,
             description,
             due_date,
             priority,
             original_column_name,
             canceled_by_user_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            projectId,
            group.canceled_group_id,
            card.created_by_user_id,
            card.assigned_user_id,
            card.title,
            card.description,
            card.due_date,
            card.priority ?? 'medium',
            column.name,
            userId,
          ],
        );
      }

      await client.query('DELETE FROM columns WHERE column_id = $1 AND project_id = $2', [
        columnId,
        projectId,
      ]);

      await client.query('COMMIT');

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

      return {
        ...group,
        cards_count: cards.length,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async unarchiveCard(
    projectId: number,
    canceledCardId: number,
    targetColumnId: number,
    userId: number,
  ) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const { rows: targetColumnRows } = await this.db.query(
      'SELECT project_id FROM columns WHERE column_id = $1',
      [targetColumnId],
    );

    if (targetColumnRows.length === 0 || targetColumnRows[0].project_id !== projectId) {
      throw new ForbiddenException('Target column does not belong to this project');
    }

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const { rows: canceledRows } = await client.query(
        `SELECT *
         FROM canceled_cards
         WHERE canceled_card_id = $1 AND project_id = $2
         FOR UPDATE`,
        [canceledCardId, projectId],
      );

      if (canceledRows.length === 0) {
        throw new NotFoundException('Canceled card not found');
      }

      const canceledCard = canceledRows[0];

      const { rows: posRows } = await client.query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM cards WHERE column_id = $1',
        [targetColumnId],
      );
      const nextPos = Number(posRows[0].next_pos) || 0;

      const { rows: cardRows } = await client.query(
        `INSERT INTO cards (
           column_id,
           created_by_user_id,
           assigned_user_id,
           title,
           description,
           due_date,
           priority,
           position
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          targetColumnId,
          canceledCard.created_by_user_id,
          canceledCard.assigned_user_id,
          canceledCard.title,
          canceledCard.description,
          canceledCard.due_date,
          canceledCard.priority,
          nextPos,
        ],
      );

      await client.query(
        `DELETE FROM canceled_cards
         WHERE canceled_card_id = $1 AND project_id = $2`,
        [canceledCardId, projectId],
      );

      if (canceledCard.canceled_group_id) {
        const { rows: countRows } = await client.query(
          'SELECT COUNT(*)::int AS remaining FROM canceled_cards WHERE canceled_group_id = $1',
          [canceledCard.canceled_group_id],
        );
        if (countRows[0].remaining === 0) {
          await client.query(
            'DELETE FROM canceled_column_groups WHERE canceled_group_id = $1 AND project_id = $2',
            [canceledCard.canceled_group_id, projectId],
          );
        }
      }

      await client.query('COMMIT');

      const card = cardRows[0];
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
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteCanceledCard(projectId: number, canceledCardId: number, userId: number) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `DELETE FROM canceled_cards
         WHERE canceled_card_id = $1 AND project_id = $2
         RETURNING canceled_group_id`,
        [canceledCardId, projectId],
      );

      if (rows.length === 0) {
        throw new NotFoundException('Canceled card not found');
      }

      const canceledGroupId = rows[0].canceled_group_id as number | null;
      if (canceledGroupId) {
        const { rows: countRows } = await client.query(
          'SELECT COUNT(*)::int AS remaining FROM canceled_cards WHERE canceled_group_id = $1',
          [canceledGroupId],
        );
        if (countRows[0].remaining === 0) {
          await client.query(
            'DELETE FROM canceled_column_groups WHERE canceled_group_id = $1 AND project_id = $2',
            [canceledGroupId, projectId],
          );
        }
      }

      await client.query('COMMIT');

      this.realtimeEvents.emitToProject(projectId, 'board.canceled.card.deleted', {
        project_id: projectId,
        canceled_card_id: canceledCardId,
      });
      this.realtimeEvents.emitToProject(projectId, 'board.canceled.updated', {
        project_id: projectId,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteCanceledGroup(projectId: number, canceledGroupId: number, userId: number) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const { rows } = await this.db.query(
      `DELETE FROM canceled_column_groups
       WHERE canceled_group_id = $1 AND project_id = $2
       RETURNING canceled_group_id`,
      [canceledGroupId, projectId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Canceled column group not found');
    }

    this.realtimeEvents.emitToProject(projectId, 'board.canceled.group.deleted', {
      project_id: projectId,
      canceled_group_id: canceledGroupId,
    });
    this.realtimeEvents.emitToProject(projectId, 'board.canceled.updated', {
      project_id: projectId,
    });
  }
}
