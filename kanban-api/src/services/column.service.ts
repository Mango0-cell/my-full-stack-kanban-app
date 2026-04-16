import pool from '../config/db';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';

async function assertProjectMember(projectId: number, userId: number) {
  const { rows } = await pool.query(
    `SELECT pm.role_id, r.role_name FROM project_members pm
     JOIN roles r ON r.role_id = pm.role_id
     WHERE pm.project_id = $1 AND pm.user_id = $2`,
    [projectId, userId]
  );
  if (rows.length === 0) throw new ForbiddenError('Not a member of this project');
  return rows[0] as { role_name: string };
}

export async function listColumns(projectId: number, userId: number) {
  await assertProjectMember(projectId, userId);
  const { rows } = await pool.query(
    'SELECT * FROM columns WHERE project_id = $1 ORDER BY position, column_id',
    [projectId]
  );
  return rows;
}

export async function createColumn(projectId: number, userId: number, name: string, position?: number) {
  await assertProjectMember(projectId, userId);

  let pos = position;
  if (pos === undefined) {
    const { rows } = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM columns WHERE project_id = $1',
      [projectId]
    );
    pos = rows[0].next_pos;
  }

  const { rows } = await pool.query(
    `INSERT INTO columns (project_id, created_by_user_id, name, position)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [projectId, userId, name, pos]
  );
  return rows[0];
}

export async function updateColumn(
  projectId: number,
  columnId: number,
  userId: number,
  updates: { name?: string; position?: number }
) {
  await assertProjectMember(projectId, userId);

  const { rows: existing } = await pool.query(
    'SELECT * FROM columns WHERE column_id = $1 AND project_id = $2',
    [columnId, projectId]
  );
  if (existing.length === 0) throw new NotFoundError('Column not found');

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.name !== undefined) { fields.push(`name = $${idx}`); values.push(updates.name); idx++; }
  if (updates.position !== undefined) { fields.push(`position = $${idx}`); values.push(updates.position); idx++; }
  if (fields.length === 0) throw new ValidationError('No fields to update');

  fields.push(`updated_at = NOW()`);
  values.push(columnId);

  const { rows } = await pool.query(
    `UPDATE columns SET ${fields.join(', ')} WHERE column_id = $${idx} RETURNING *`,
    values
  );
  return rows[0];
}

export async function deleteColumn(projectId: number, columnId: number, userId: number) {
  await assertProjectMember(projectId, userId);
  const { rows } = await pool.query(
    'DELETE FROM columns WHERE column_id = $1 AND project_id = $2 RETURNING column_id',
    [columnId, projectId]
  );
  if (rows.length === 0) throw new NotFoundError('Column not found');
}
