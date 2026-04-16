import pool from '../config/db';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../utils/errors';

async function assertMember(projectId: number, userId: number) {
  const { rows } = await pool.query(
    `SELECT pm.role_id, r.role_name FROM project_members pm
     JOIN roles r ON r.role_id = pm.role_id
     WHERE pm.project_id = $1 AND pm.user_id = $2`,
    [projectId, userId]
  );
  if (rows.length === 0) throw new ForbiddenError('Not a member of this project');
  return rows[0] as { role_id: number; role_name: string };
}

async function assertOwnerOrAdmin(projectId: number, userId: number) {
  const role = await assertMember(projectId, userId);
  if (role.role_name !== 'owner' && role.role_name !== 'admin') {
    throw new ForbiddenError('Requires owner or admin role');
  }
  return role;
}

async function assertOwner(projectId: number, userId: number) {
  const role = await assertMember(projectId, userId);
  if (role.role_name !== 'owner') {
    throw new ForbiddenError('Requires owner role');
  }
}

export async function listProjects(userId: number) {
  const { rows } = await pool.query(
    `SELECT p.project_id, p.project_name, p.description, p.owner_user_id,
            p.created_at, p.updated_at, r.role_name AS member_role
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.project_id
     JOIN roles r ON r.role_id = pm.role_id
     WHERE pm.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function createProject(userId: number, projectName: string, description?: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO projects (owner_user_id, project_name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, projectName, description || null]
    );
    const project = rows[0];

    const ownerRole = await client.query(
      'SELECT role_id FROM roles WHERE role_name = $1',
      ['owner']
    );
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role_id)
       VALUES ($1, $2, $3)`,
      [project.project_id, userId, ownerRole.rows[0].role_id]
    );

    await client.query('COMMIT');
    return project;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getProject(projectId: number, userId: number) {
  await assertMember(projectId, userId);
  const { rows } = await pool.query(
    'SELECT * FROM projects WHERE project_id = $1',
    [projectId]
  );
  if (rows.length === 0) throw new NotFoundError('Project not found');
  return rows[0];
}

export async function updateProject(
  projectId: number,
  userId: number,
  updates: { project_name?: string; description?: string }
) {
  await assertOwnerOrAdmin(projectId, userId);
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.project_name) { fields.push(`project_name = $${idx}`); values.push(updates.project_name); idx++; }
  if ('description' in updates) { fields.push(`description = $${idx}`); values.push(updates.description); idx++; }
  if (fields.length === 0) throw new ValidationError('No fields to update');

  fields.push(`updated_at = NOW()`);
  values.push(projectId);

  const { rows } = await pool.query(
    `UPDATE projects SET ${fields.join(', ')} WHERE project_id = $${idx} RETURNING *`,
    values
  );
  return rows[0];
}

export async function deleteProject(projectId: number, userId: number) {
  await assertOwner(projectId, userId);
  const { rows } = await pool.query(
    'DELETE FROM projects WHERE project_id = $1 RETURNING project_id',
    [projectId]
  );
  if (rows.length === 0) throw new NotFoundError('Project not found');
}

export async function listMembers(projectId: number, userId: number) {
  await assertMember(projectId, userId);
  const { rows } = await pool.query(
    `SELECT u.user_id, u.email, u.display_name, u.avatar_url, r.role_name, pm.joined_at
     FROM project_members pm
     JOIN users u ON u.user_id = pm.user_id
     JOIN roles r ON r.role_id = pm.role_id
     WHERE pm.project_id = $1
     ORDER BY pm.joined_at`,
    [projectId]
  );
  return rows;
}

export async function addMember(
  projectId: number,
  requesterId: number,
  userEmail: string,
  roleName: string
) {
  await assertOwnerOrAdmin(projectId, requesterId);

  const userResult = await pool.query(
    'SELECT user_id FROM users WHERE email = $1',
    [userEmail]
  );
  if (userResult.rows.length === 0) throw new NotFoundError('User not found');
  const targetUserId = userResult.rows[0].user_id;

  const roleResult = await pool.query(
    'SELECT role_id FROM roles WHERE role_name = $1',
    [roleName]
  );
  if (roleResult.rows.length === 0) throw new ValidationError('Invalid role name');

  try {
    const { rows } = await pool.query(
      `INSERT INTO project_members (project_id, user_id, role_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [projectId, targetUserId, roleResult.rows[0].role_id]
    );
    return rows[0];
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') throw new ConflictError('User is already a member');
    throw err;
  }
}

export async function updateMemberRole(
  projectId: number,
  requesterId: number,
  targetUserId: number,
  roleName: string
) {
  await assertOwnerOrAdmin(projectId, requesterId);

  const roleResult = await pool.query(
    'SELECT role_id FROM roles WHERE role_name = $1',
    [roleName]
  );
  if (roleResult.rows.length === 0) throw new ValidationError('Invalid role name');

  const { rows } = await pool.query(
    `UPDATE project_members SET role_id = $1
     WHERE project_id = $2 AND user_id = $3
     RETURNING *`,
    [roleResult.rows[0].role_id, projectId, targetUserId]
  );
  if (rows.length === 0) throw new NotFoundError('Member not found');
  return rows[0];
}

export async function removeMember(projectId: number, requesterId: number, targetUserId: number) {
  await assertOwnerOrAdmin(projectId, requesterId);

  // Prevent removing the last owner
  const { rows: ownerRows } = await pool.query(
    `SELECT COUNT(*) as cnt FROM project_members pm
     JOIN roles r ON r.role_id = pm.role_id
     WHERE pm.project_id = $1 AND r.role_name = 'owner'`,
    [projectId]
  );
  if (parseInt(ownerRows[0].cnt, 10) <= 1) {
    const { rows: targetRole } = await pool.query(
      `SELECT r.role_name FROM project_members pm
       JOIN roles r ON r.role_id = pm.role_id
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [projectId, targetUserId]
    );
    if (targetRole.length > 0 && targetRole[0].role_name === 'owner') {
      throw new ForbiddenError('Cannot remove the last owner');
    }
  }

  const { rows } = await pool.query(
    'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING *',
    [projectId, targetUserId]
  );
  if (rows.length === 0) throw new NotFoundError('Member not found');
}
