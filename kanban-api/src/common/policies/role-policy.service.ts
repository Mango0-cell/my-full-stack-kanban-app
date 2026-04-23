import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

type ProjectRole = 'owner' | 'admin' | 'editor' | 'member' | 'viewer';

export interface ProjectMembershipContext {
  project_id: number;
  owner_user_id: number;
  role_name: ProjectRole;
}

@Injectable()
export class RolePolicyService {
  constructor(private readonly db: DatabaseService) {}

  private readonly boardWriteRoles = new Set<ProjectRole>(['owner', 'admin', 'editor', 'member']);
  private readonly collaboratorManagerRoles = new Set<ProjectRole>(['owner', 'admin']);
  private readonly privilegedRoles = new Set<ProjectRole>(['owner', 'admin']);

  async getProjectMembership(projectId: number, userId: number): Promise<ProjectMembershipContext> {
    const { rows } = await this.db.query(
      `SELECT p.project_id, p.owner_user_id, r.role_name
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.project_id
       JOIN roles r ON r.role_id = pm.role_id
       WHERE p.project_id = $1 AND pm.user_id = $2`,
      [projectId, userId],
    );
    if (rows.length === 0) {
      throw new ForbiddenException('Not a member of this project');
    }
    return rows[0] as ProjectMembershipContext;
  }

  async assertProjectReadable(projectId: number, userId: number): Promise<ProjectMembershipContext> {
    return this.getProjectMembership(projectId, userId);
  }

  async assertProjectBoardWrite(projectId: number, userId: number): Promise<ProjectMembershipContext> {
    const membership = await this.getProjectMembership(projectId, userId);
    if (!this.boardWriteRoles.has(membership.role_name)) {
      throw new ForbiddenException('Requires editor or admin role');
    }
    return membership;
  }

  async assertProjectCollaboratorManage(projectId: number, userId: number): Promise<ProjectMembershipContext> {
    const membership = await this.getProjectMembership(projectId, userId);
    if (!this.collaboratorManagerRoles.has(membership.role_name)) {
      throw new ForbiddenException('Requires admin role');
    }
    return membership;
  }

  async assertProjectOwner(projectId: number, userId: number): Promise<ProjectMembershipContext> {
    const membership = await this.getProjectMembership(projectId, userId);
    if (membership.owner_user_id !== userId) {
      throw new ForbiddenException('Requires owner role');
    }
    return membership;
  }

  async getCardProjectId(cardId: number): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT col.project_id
       FROM cards c
       JOIN columns col ON col.column_id = c.column_id
       WHERE c.card_id = $1`,
      [cardId],
    );
    if (rows.length === 0) throw new NotFoundException('Card not found');
    return rows[0].project_id as number;
  }

  async getColumnProjectId(columnId: number): Promise<number> {
    const { rows } = await this.db.query(
      'SELECT project_id FROM columns WHERE column_id = $1',
      [columnId],
    );
    if (rows.length === 0) throw new NotFoundException('Column not found');
    return rows[0].project_id as number;
  }

  isPrivilegedRole(roleName: string): boolean {
    return this.privilegedRoles.has(roleName as ProjectRole);
  }
}
