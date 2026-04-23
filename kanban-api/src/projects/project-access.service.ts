import { ForbiddenException, Injectable } from '@nestjs/common';
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
}
