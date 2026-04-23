import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RolePolicyService } from '../common/policies/role-policy.service';

@Injectable()
export class AttachmentsService {
  constructor(
    private db: DatabaseService,
    private readonly rolePolicy: RolePolicyService,
  ) {}

  private async getAttachmentProject(attachmentId: number): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT col.project_id
       FROM attachments a
       JOIN cards c ON c.card_id = a.card_id
       JOIN columns col ON col.column_id = c.column_id
       WHERE a.attachment_id = $1`,
      [attachmentId],
    );
    if (rows.length === 0) throw new NotFoundException('Attachment not found');
    return rows[0].project_id as number;
  }

  async listAttachments(cardId: number, userId: number) {
    const projectId = await this.rolePolicy.getCardProjectId(cardId);
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    const { rows } = await this.db.query(
      `SELECT a.*, u.display_name AS uploader_name
       FROM attachments a
       JOIN users u ON u.user_id = a.uploaded_by_user_id
       WHERE a.card_id = $1
       ORDER BY a.created_at`,
      [cardId],
    );
    return rows;
  }

  async addAttachment(cardId: number, userId: number, fileUrl: string, fileName: string) {
    const projectId = await this.rolePolicy.getCardProjectId(cardId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);
    const { rows } = await this.db.query(
      `INSERT INTO attachments (card_id, uploaded_by_user_id, file_url, file_name)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [cardId, userId, fileUrl, fileName],
    );
    return rows[0];
  }

  async deleteAttachment(attachmentId: number, userId: number) {
    const projectId = await this.getAttachmentProject(attachmentId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);
    await this.db.query('DELETE FROM attachments WHERE attachment_id = $1', [attachmentId]);
  }
}
