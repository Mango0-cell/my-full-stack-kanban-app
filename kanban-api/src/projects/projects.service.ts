import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RolePolicyService } from '../common/policies/role-policy.service';

@Injectable()
export class ProjectsService {
  constructor(
    private db: DatabaseService,
    private readonly rolePolicy: RolePolicyService,
  ) {}

  private async getRoleByName(roleName: string) {
    const normalizedRole = roleName.trim().toLowerCase();
    const candidates =
      normalizedRole === 'editor' ? ['editor', 'member'] : normalizedRole === 'member' ? ['member', 'editor'] : [normalizedRole];
    const { rows } = await this.db.query(
      `SELECT role_id, role_name
       FROM roles
       WHERE role_name = ANY($1::text[])
       ORDER BY CASE WHEN role_name = $2 THEN 0 ELSE 1 END
       LIMIT 1`,
      [candidates, normalizedRole],
    );
    if (rows.length === 0) throw new BadRequestException('Invalid role name');
    return rows[0] as { role_id: number; role_name: string };
  }

  private async getMemberRole(projectId: number, targetUserId: number) {
    const { rows } = await this.db.query(
      `SELECT pm.user_id, r.role_name
       FROM project_members pm
       JOIN roles r ON r.role_id = pm.role_id
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [projectId, targetUserId],
    );
    if (rows.length === 0) throw new NotFoundException('Member not found');
    return rows[0] as { user_id: number; role_name: string };
  }

  async listProjects(userId: number) {
    const { rows } = await this.db.query(
      `SELECT p.project_id, p.project_name, p.description, p.owner_user_id,
              p.created_at, p.updated_at, r.role_name AS member_role
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.project_id
       JOIN roles r ON r.role_id = pm.role_id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId],
    );
    return rows;
  }

  async createProject(userId: number, projectName: string, description?: string) {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO projects (owner_user_id, project_name, description)
         VALUES ($1, $2, $3) RETURNING *`,
        [userId, projectName, description || null],
      );
      const project = rows[0];

      const ownerRole = await client.query(
        'SELECT role_id FROM roles WHERE role_name = $1',
        ['owner'],
      );
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role_id)
         VALUES ($1, $2, $3)`,
        [project.project_id, userId, ownerRole.rows[0].role_id],
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

  async getProject(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    const { rows } = await this.db.query(
      'SELECT * FROM projects WHERE project_id = $1',
      [projectId],
    );
    if (rows.length === 0) throw new NotFoundException('Project not found');
    return rows[0];
  }

  async updateProject(projectId: number, userId: number, updates: { project_name?: string; description?: string }) {
    await this.rolePolicy.assertProjectCollaboratorManage(projectId, userId);
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.project_name) { fields.push(`project_name = $${idx}`); values.push(updates.project_name); idx++; }
    if ('description' in updates) { fields.push(`description = $${idx}`); values.push(updates.description); idx++; }
    if (fields.length === 0) throw new BadRequestException('No fields to update');

    fields.push(`updated_at = NOW()`);
    values.push(projectId);

    const { rows } = await this.db.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE project_id = $${idx} RETURNING *`,
      values,
    );
    return rows[0];
  }

  async deleteProject(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectOwner(projectId, userId);
    const { rows } = await this.db.query(
      'DELETE FROM projects WHERE project_id = $1 RETURNING project_id',
      [projectId],
    );
    if (rows.length === 0) throw new NotFoundException('Project not found');
  }

  async listMembers(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    const { rows } = await this.db.query(
      `SELECT
         u.user_id,
         u.email,
         u.display_name,
         u.avatar_url,
         r.role_name,
         pm.joined_at,
         'joined'::text AS membership_status,
         NULL::integer AS invitation_id,
         NULL::text AS invitation_status
       FROM project_members pm
       JOIN users u ON u.user_id = pm.user_id
       JOIN roles r ON r.role_id = pm.role_id
       WHERE pm.project_id = $1

       UNION ALL

       SELECT
         COALESCE(u.user_id, -i.invitation_id) AS user_id,
         i.invitee_email AS email,
         COALESCE(u.display_name, SPLIT_PART(i.invitee_email, '@', 1)) AS display_name,
         u.avatar_url,
         r.role_name,
         i.created_at AS joined_at,
         'pending'::text AS membership_status,
         i.invitation_id,
         i.status AS invitation_status
       FROM invitations i
       LEFT JOIN users u
         ON u.user_id = i.invitee_user_id
         OR (
           i.invitee_user_id IS NULL
           AND LOWER(u.email) = LOWER(i.invitee_email)
         )
       JOIN roles r ON r.role_id = i.role_id
       WHERE i.project_id = $1
         AND i.status = 'pending'
         AND NOT EXISTS (
           SELECT 1
           FROM project_members pm_existing
           LEFT JOIN users u_existing ON u_existing.user_id = pm_existing.user_id
           WHERE pm_existing.project_id = i.project_id
             AND (
               (i.invitee_user_id IS NOT NULL AND pm_existing.user_id = i.invitee_user_id)
               OR (
                 i.invitee_user_id IS NULL
                 AND LOWER(u_existing.email) = LOWER(i.invitee_email)
               )
             )
         )
       ORDER BY joined_at`,
      [projectId],
    );
    return rows;
  }

  async addMember(projectId: number, requesterId: number, userEmail: string, roleName: string) {
    const requester = await this.rolePolicy.assertProjectCollaboratorManage(projectId, requesterId);
    const requesterIsProjectAuthor = requester.owner_user_id === requesterId;

    const userResult = await this.db.query(
      'SELECT user_id FROM users WHERE email = $1',
      [userEmail],
    );
    if (userResult.rows.length === 0) throw new NotFoundException('User not found');
    const targetUserId = userResult.rows[0].user_id;

    const roleResult = await this.getRoleByName(roleName);

    if (!requesterIsProjectAuthor && this.rolePolicy.isPrivilegedRole(roleResult.role_name)) {
      throw new ForbiddenException('Only project owner can assign privileged roles');
    }

    try {
      const { rows } = await this.db.query(
        `INSERT INTO project_members (project_id, user_id, role_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [projectId, targetUserId, roleResult.role_id],
      );
      return rows[0];
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException('User is already a member');
      }
      throw err;
    }
  }

  async updateMemberRole(projectId: number, requesterId: number, targetUserId: number, roleName: string) {
    const requester = await this.rolePolicy.assertProjectCollaboratorManage(projectId, requesterId);
    const requesterIsProjectAuthor = requester.owner_user_id === requesterId;
    const targetMember = await this.getMemberRole(projectId, targetUserId);
    const roleResult = await this.getRoleByName(roleName);

    if (targetUserId === requesterId && requesterIsProjectAuthor) {
      throw new ForbiddenException('Project owner cannot change own project role');
    }
    if (!requesterIsProjectAuthor) {
      if (this.rolePolicy.isPrivilegedRole(targetMember.role_name)) {
        throw new ForbiddenException('Only project owner can change privileged roles');
      }
      if (this.rolePolicy.isPrivilegedRole(roleResult.role_name)) {
        throw new ForbiddenException('Only project owner can assign privileged roles');
      }
    }

    const { rows } = await this.db.query(
      `UPDATE project_members SET role_id = $1
       WHERE project_id = $2 AND user_id = $3 RETURNING *`,
      [roleResult.role_id, projectId, targetUserId],
    );
    if (rows.length === 0) throw new NotFoundException('Member not found');
    return rows[0];
  }

  async removeMember(projectId: number, requesterId: number, targetUserId: number) {
    const requester = await this.rolePolicy.assertProjectCollaboratorManage(projectId, requesterId);
    const requesterIsProjectAuthor = requester.owner_user_id === requesterId;
    const targetMember = await this.getMemberRole(projectId, targetUserId);

    if (targetUserId === requesterId && requesterIsProjectAuthor) {
      throw new ForbiddenException('Project owner cannot remove self from the project');
    }
    if (!requesterIsProjectAuthor && this.rolePolicy.isPrivilegedRole(targetMember.role_name)) {
      throw new ForbiddenException('Only project owner can remove privileged roles');
    }

    const { rows: ownerRows } = await this.db.query(
      `SELECT COUNT(*) as cnt FROM project_members pm
       JOIN roles r ON r.role_id = pm.role_id
       WHERE pm.project_id = $1 AND r.role_name = 'owner'`,
      [projectId],
    );
    if (parseInt(ownerRows[0].cnt, 10) <= 1 && targetMember.role_name === 'owner') {
      throw new ForbiddenException('Cannot remove the last owner');
    }

    const { rows } = await this.db.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING *',
      [projectId, targetUserId],
    );
    if (rows.length === 0) throw new NotFoundException('Member not found');
  }
}
