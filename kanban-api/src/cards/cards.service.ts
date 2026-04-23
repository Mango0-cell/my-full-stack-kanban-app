import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { RolePolicyService } from '../common/policies/role-policy.service';

@Injectable()
export class CardsService {
  constructor(
    private db: DatabaseService,
    private readonly realtimeEvents: RealtimeEventsService,
    private readonly rolePolicy: RolePolicyService,
  ) {}

  private async getColumnProject(columnId: number): Promise<number> {
    return this.rolePolicy.getColumnProjectId(columnId);
  }

  private async logActivity(
    cardId: number,
    userId: number,
    actionType: string,
    oldValue: string | null = null,
    newValue: string | null = null,
  ) {
    await this.db.query(
      `INSERT INTO card_activity (card_id, user_id, action_type, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [cardId, userId, actionType, oldValue, newValue],
    );
  }

  async listCards(columnId: number, userId: number) {
    const projectId = await this.getColumnProject(columnId);
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    const { rows } = await this.db.query(
      'SELECT * FROM cards WHERE column_id = $1 ORDER BY position, card_id',
      [columnId],
    );
    return rows;
  }

  async listCardsByProject(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    const { rows } = await this.db.query(
      `SELECT c.* FROM cards c
       JOIN columns col ON col.column_id = c.column_id
       WHERE col.project_id = $1
       ORDER BY c.column_id, c.position, c.card_id`,
      [projectId],
    );
    return rows;
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
    const projectId = await this.getColumnProject(columnId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    let pos = data.position;
    if (pos === undefined) {
      const { rows } = await this.db.query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM cards WHERE column_id = $1',
        [columnId],
      );
      pos = rows[0].next_pos;
    }

    const { rows } = await this.db.query(
      `INSERT INTO cards (column_id, created_by_user_id, assigned_user_id, title, description, due_date, priority, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [columnId, userId, data.assigned_user_id || null, data.title, data.description || null,
       data.due_date || null, data.priority || 'medium', pos],
    );
    const card = rows[0];
    await this.logActivity(card.card_id, userId, 'created', null, card.title);
    this.realtimeEvents.emitToProject(projectId, 'board.card.created', { project_id: projectId, card });
    return card;
  }

  async getCard(cardId: number, userId: number) {
    const { rows } = await this.db.query('SELECT * FROM cards WHERE card_id = $1', [cardId]);
    if (rows.length === 0) throw new NotFoundException('Card not found');
    const card = rows[0];
    const projectId = await this.getColumnProject(card.column_id);
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    return card;
  }

  async updateCard(cardId: number, userId: number, updates: Record<string, unknown>) {
    const { rows: existing } = await this.db.query('SELECT * FROM cards WHERE card_id = $1', [cardId]);
    if (existing.length === 0) throw new NotFoundException('Card not found');
    const card = existing[0];

    const projectId = await this.getColumnProject(card.column_id);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const allowed = ['title', 'description', 'due_date', 'priority', 'assigned_user_id'];
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    const activityLog: Array<{ action: string; old: string | null; new_: string | null }> = [];

    for (const key of allowed) {
      if (key in updates) {
        fields.push(`${key} = $${idx}`);
        values.push(updates[key]);
        idx++;

        if (key === 'title') activityLog.push({ action: 'updated_title', old: card.title, new_: String(updates[key]) });
        if (key === 'description') activityLog.push({ action: 'updated_description', old: card.description, new_: String(updates[key] ?? '') });
        if (key === 'priority') activityLog.push({ action: 'priority_changed', old: card.priority, new_: String(updates[key]) });
        if (key === 'due_date') activityLog.push({ action: 'due_date_changed', old: card.due_date, new_: String(updates[key] ?? '') });
        if (key === 'assigned_user_id') {
          const newAssignee = updates[key];
          if (newAssignee) {
            activityLog.push({ action: 'assigned', old: card.assigned_user_id, new_: String(newAssignee) });
          } else {
            activityLog.push({ action: 'unassigned', old: card.assigned_user_id, new_: null });
          }
        }
      }
    }

    if (fields.length === 0) throw new BadRequestException('No fields to update');
    fields.push(`updated_at = NOW()`);
    values.push(cardId);

    const { rows } = await this.db.query(
      `UPDATE cards SET ${fields.join(', ')} WHERE card_id = $${idx} RETURNING *`,
      values,
    );

    for (const log of activityLog) {
      await this.logActivity(cardId, userId, log.action, log.old, log.new_);
    }

    this.realtimeEvents.emitToProject(projectId, 'board.card.updated', {
      project_id: projectId,
      card_id: cardId,
      card: rows[0],
    });

    return rows[0];
  }

  async deleteCard(cardId: number, userId: number) {
    const { rows: existing } = await this.db.query('SELECT * FROM cards WHERE card_id = $1', [cardId]);
    if (existing.length === 0) throw new NotFoundException('Card not found');
    const card = existing[0];

    const projectId = await this.getColumnProject(card.column_id);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    await this.logActivity(cardId, userId, 'deleted', card.title, null);
    await this.db.query('DELETE FROM cards WHERE card_id = $1', [cardId]);
    this.realtimeEvents.emitToProject(projectId, 'board.card.deleted', {
      project_id: projectId,
      card_id: cardId,
    });
  }

  async moveCard(cardId: number, userId: number, targetColumnId: number, position: number) {
    const { rows: existing } = await this.db.query('SELECT * FROM cards WHERE card_id = $1', [cardId]);
    if (existing.length === 0) throw new NotFoundException('Card not found');
    const card = existing[0];

    const srcProjectId = await this.getColumnProject(card.column_id);
    await this.rolePolicy.assertProjectBoardWrite(srcProjectId, userId);

    const destProjectId = await this.getColumnProject(targetColumnId);
    if (srcProjectId !== destProjectId) {
      throw new ForbiddenException('Cannot move card to a column in a different project');
    }

    const oldValue = `column:${card.column_id},pos:${card.position}`;
    const newValue = `column:${targetColumnId},pos:${position}`;

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const srcColumnId: number = card.column_id;
      const oldPosition: number = card.position;
      const sameColumn = srcColumnId === targetColumnId;

      if (sameColumn) {
        if (oldPosition < position) {
          // Moving down: shift cards between old and new positions up by 1
          await client.query(
            `UPDATE cards SET position = position - 1
             WHERE column_id = $1 AND position > $2 AND position <= $3 AND card_id != $4`,
            [srcColumnId, oldPosition, position, cardId],
          );
        } else if (oldPosition > position) {
          // Moving up: shift cards between new and old positions down by 1
          await client.query(
            `UPDATE cards SET position = position + 1
             WHERE column_id = $1 AND position >= $2 AND position < $3 AND card_id != $4`,
            [srcColumnId, position, oldPosition, cardId],
          );
        }
      } else {
        // Cross-column: close gap in source column
        await client.query(
          `UPDATE cards SET position = position - 1
           WHERE column_id = $1 AND position > $2 AND card_id != $3`,
          [srcColumnId, oldPosition, cardId],
        );
        // Open gap in destination column
        await client.query(
          `UPDATE cards SET position = position + 1
           WHERE column_id = $1 AND position >= $2 AND card_id != $3`,
          [targetColumnId, position, cardId],
        );
      }

      // Place the card at target position
      const { rows } = await client.query(
        `UPDATE cards SET column_id = $1, position = $2, updated_at = NOW()
         WHERE card_id = $3 RETURNING *`,
        [targetColumnId, position, cardId],
      );

      await client.query('COMMIT');

      await this.logActivity(cardId, userId, 'moved', oldValue, newValue);
      this.realtimeEvents.emitToProject(srcProjectId, 'board.card.moved', {
        project_id: srcProjectId,
        card_id: cardId,
        card: rows[0],
      });
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
