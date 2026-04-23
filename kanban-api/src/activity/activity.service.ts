import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RolePolicyService } from '../common/policies/role-policy.service';

@Injectable()
export class ActivityService {
  constructor(
    private db: DatabaseService,
    private readonly rolePolicy: RolePolicyService,
  ) {}

  async getCardActivity(cardId: number, userId: number) {
    const projectId = await this.rolePolicy.getCardProjectId(cardId);
    await this.rolePolicy.assertProjectReadable(projectId, userId);

    const { rows } = await this.db.query(
      `SELECT a.*, u.display_name, u.avatar_url
       FROM card_activity a
       JOIN users u ON u.user_id = a.user_id
       WHERE a.card_id = $1
       ORDER BY a.created_at DESC`,
      [cardId],
    );
    return rows;
  }
}
