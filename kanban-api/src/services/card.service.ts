import pool from '../config/db';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';

async function getColumnProject(columnId: number): Promise<number> {
  const { rows } = await pool.query('SELECT project_id FROM columns WHERE column_id = $1', [columnId]);
  if (rows.length === 0) throw new NotFoundError('Column not found');
  return rows[0].project_id;
}

async function assertProjectMember(projectId: number, userId: number) {
  const { rows } = await pool.query(
    'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (rows.length === 0) throw new ForbiddenError('Not a member of this project');
}

async function logActivity(
  cardId: number,
  userId: number,
  actionType: string,
  oldValue: string | null = null,
  newValue: string | null = null
) {
  await pool.query(
    `INSERT INTO card_activity (card_id, user_id, action_type, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    [cardId, userId, actionType, oldValue, newValue]
  );
}

export async function listCards(columnId: number, userId: number) {
  const projectId = await getColumnProject(columnId);
  await assertProjectMember(projectId, userId);
  const { rows } = await pool.query(
    'SELECT * FROM cards WHERE column_id = $1 ORDER BY position, card_id',
    [columnId]
  );
  return rows;
}

export async function listCardsByProject(projectId: number, userId: number) {
  await assertProjectMember(projectId, userId);
  const { rows } = await pool.query(
    `SELECT c.* FROM cards c
     JOIN columns col ON col.column_id = c.column_id
     WHERE col.project_id = $1
     ORDER BY c.column_id, c.position, c.card_id`,
    [projectId]
  );
  return rows;
}

export async function createCard(
  columnId: number,
  userId: number,
  data: {
    title: string;
    description?: string;
    due_date?: string;
    priority?: string;
    assigned_user_id?: number;
    position?: number;
  }
) {
  const projectId = await getColumnProject(columnId);
  await assertProjectMember(projectId, userId);

  let pos = data.position;
  if (pos === undefined) {
    const { rows } = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM cards WHERE column_id = $1',
      [columnId]
    );
    pos = rows[0].next_pos;
  }

  const { rows } = await pool.query(
    `INSERT INTO cards (column_id, created_by_user_id, assigned_user_id, title, description, due_date, priority, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [columnId, userId, data.assigned_user_id || null, data.title, data.description || null,
     data.due_date || null, data.priority || 'medium', pos]
  );
  const card = rows[0];
  await logActivity(card.card_id, userId, 'created', null, card.title);
  return card;
}

export async function getCard(cardId: number, userId: number) {
  const { rows } = await pool.query('SELECT * FROM cards WHERE card_id = $1', [cardId]);
  if (rows.length === 0) throw new NotFoundError('Card not found');
  const card = rows[0];
  const projectId = await getColumnProject(card.column_id);
  await assertProjectMember(projectId, userId);
  return card;
}

export async function updateCard(
  cardId: number,
  userId: number,
  updates: Record<string, unknown>
) {
  const { rows: existing } = await pool.query('SELECT * FROM cards WHERE card_id = $1', [cardId]);
  if (existing.length === 0) throw new NotFoundError('Card not found');
  const card = existing[0];

  const projectId = await getColumnProject(card.column_id);
  await assertProjectMember(projectId, userId);

  // Only creator or assignee can update
  if (card.created_by_user_id !== userId && card.assigned_user_id !== userId) {
    throw new ForbiddenError('Only the card creator or assignee can update this card');
  }

  const allowed = ['title', 'description', 'due_date', 'priority', 'assigned_user_id'];
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  const activityLog: Array<{ action: string; old: string | null; new: string | null }> = [];

  for (const key of allowed) {
    if (key in updates) {
      fields.push(`${key} = $${idx}`);
      values.push(updates[key]);
      idx++;

      if (key === 'title') activityLog.push({ action: 'updated_title', old: card.title, new: String(updates[key]) });
      if (key === 'description') activityLog.push({ action: 'updated_description', old: card.description, new: String(updates[key] ?? '') });
      if (key === 'priority') activityLog.push({ action: 'priority_changed', old: card.priority, new: String(updates[key]) });
      if (key === 'due_date') activityLog.push({ action: 'due_date_changed', old: card.due_date, new: String(updates[key] ?? '') });
      if (key === 'assigned_user_id') {
        const newAssignee = updates[key];
        if (newAssignee) {
          activityLog.push({ action: 'assigned', old: card.assigned_user_id, new: String(newAssignee) });
        } else {
          activityLog.push({ action: 'unassigned', old: card.assigned_user_id, new: null });
        }
      }
    }
  }

  if (fields.length === 0) throw new ValidationError('No fields to update');
  fields.push(`updated_at = NOW()`);
  values.push(cardId);

  const { rows } = await pool.query(
    `UPDATE cards SET ${fields.join(', ')} WHERE card_id = $${idx} RETURNING *`,
    values
  );

  for (const log of activityLog) {
    await logActivity(cardId, userId, log.action, log.old, log.new);
  }

  return rows[0];
}

export async function deleteCard(cardId: number, userId: number) {
  const { rows: existing } = await pool.query('SELECT * FROM cards WHERE card_id = $1', [cardId]);
  if (existing.length === 0) throw new NotFoundError('Card not found');
  const card = existing[0];

  const projectId = await getColumnProject(card.column_id);
  await assertProjectMember(projectId, userId);

  if (card.created_by_user_id !== userId) {
    throw new ForbiddenError('Only the card creator can delete this card');
  }

  await logActivity(cardId, userId, 'deleted', card.title, null);
  await pool.query('DELETE FROM cards WHERE card_id = $1', [cardId]);
}

export async function moveCard(
  cardId: number,
  userId: number,
  targetColumnId: number,
  position: number
) {
  const { rows: existing } = await pool.query('SELECT * FROM cards WHERE card_id = $1', [cardId]);
  if (existing.length === 0) throw new NotFoundError('Card not found');
  const card = existing[0];

  const srcProjectId = await getColumnProject(card.column_id);
  await assertProjectMember(srcProjectId, userId);

  const destProjectId = await getColumnProject(targetColumnId);
  if (srcProjectId !== destProjectId) {
    throw new ForbiddenError('Cannot move card to a column in a different project');
  }

  const oldValue = `column:${card.column_id},pos:${card.position}`;
  const newValue = `column:${targetColumnId},pos:${position}`;

  const { rows } = await pool.query(
    `UPDATE cards SET column_id = $1, position = $2, updated_at = NOW()
     WHERE card_id = $3 RETURNING *`,
    [targetColumnId, position, cardId]
  );

  await logActivity(cardId, userId, 'moved', oldValue, newValue);
  return rows[0];
}
