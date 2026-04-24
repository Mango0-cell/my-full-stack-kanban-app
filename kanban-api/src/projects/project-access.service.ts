import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ProjectAccessService {
  constructor(private readonly db: DatabaseService) {}

  async assertMember(projectId: number, userId: number) {
    const { rows } = await this.db.query(
      `SELECT pm.role_id, r.role_name
       FROM project_members pm
       JOIN roles r ON r.role_id = pm.role_id
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [projectId, userId],
    );

    if (rows.length === 0) {
      throw new ForbiddenException('Not a member of this project');
    }

    return rows[0] as { role_id: number; role_name: string };
  }

  async assertOwnerOrAdmin(projectId: number, userId: number) {
    const member = await this.assertMember(projectId, userId);
    if (member.role_name !== 'owner' && member.role_name !== 'admin') {
      throw new ForbiddenException('Requires owner or admin role');
    }
    return member;
  }

  private readonly editBoardRoles = new Set(['owner', 'admin', 'editor']);

  async assertCanEditBoard(projectId: number, userId: number) {
    const member = await this.assertMember(projectId, userId);
    if (!this.editBoardRoles.has(member.role_name)) {
      throw new ForbiddenException('Requires owner, admin, or editor role');
    }
    return member;
  }

  async getProjectIdFromColumn(columnId: number): Promise<number> {
    const { rows } = await this.db.query(
      'SELECT project_id FROM columns WHERE column_id = $1',
      [columnId],
    );
    if (rows.length === 0) throw new NotFoundException('Column not found');
    return rows[0].project_id as number;
  }

  async getProjectIdFromCard(cardId: number): Promise<number> {
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
}
