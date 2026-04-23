import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RolePolicyService } from '../common/policies/role-policy.service';

@Injectable()
export class CommentsService {
  constructor(
    private db: DatabaseService,
    private readonly rolePolicy: RolePolicyService,
  ) {}

  private async getCommentProject(commentId: number): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT col.project_id
       FROM comments cm
       JOIN cards c ON c.card_id = cm.card_id
       JOIN columns col ON col.column_id = c.column_id
       WHERE cm.comment_id = $1`,
      [commentId],
    );
    if (rows.length === 0) throw new NotFoundException('Comment not found');
    return rows[0].project_id as number;
  }

  async listComments(cardId: number, userId: number) {
    const projectId = await this.rolePolicy.getCardProjectId(cardId);
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    const { rows } = await this.db.query(
      `SELECT cm.*, u.display_name, u.avatar_url
       FROM comments cm
       JOIN users u ON u.user_id = cm.user_id
       WHERE cm.card_id = $1
       ORDER BY cm.created_at`,
      [cardId],
    );
    return rows;
  }

  async addComment(cardId: number, userId: number, content: string) {
    const projectId = await this.rolePolicy.getCardProjectId(cardId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);
    const { rows } = await this.db.query(
      `INSERT INTO comments (card_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [cardId, userId, content],
    );
    return rows[0];
  }

  async updateComment(commentId: number, userId: number, content: string) {
    const projectId = await this.getCommentProject(commentId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const { rows: updated } = await this.db.query(
      `UPDATE comments SET content = $1, updated_at = NOW() WHERE comment_id = $2 RETURNING *`,
      [content, commentId],
    );
    return updated[0];
  }

  async deleteComment(commentId: number, userId: number) {
    const projectId = await this.getCommentProject(commentId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);
    await this.db.query('DELETE FROM comments WHERE comment_id = $1', [commentId]);
  }
}
