import pool from '../config/db';
import { ForbiddenError, NotFoundError } from '../utils/errors';

async function assertCardMember(cardId: number, userId: number) {
  const { rows } = await pool.query(
    `SELECT c.card_id FROM cards c
     JOIN columns col ON col.column_id = c.column_id
     JOIN project_members pm ON pm.project_id = col.project_id
     WHERE c.card_id = $1 AND pm.user_id = $2`,
    [cardId, userId]
  );
  if (rows.length === 0) throw new ForbiddenError('Not authorized to access this card');
}

export async function listAttachments(cardId: number, userId: number) {
  await assertCardMember(cardId, userId);
  const { rows } = await pool.query(
    `SELECT a.*, u.display_name AS uploader_name
     FROM attachments a
     JOIN users u ON u.user_id = a.uploaded_by_user_id
     WHERE a.card_id = $1
     ORDER BY a.created_at`,
    [cardId]
  );
  return rows;
}

export async function addAttachment(cardId: number, userId: number, fileUrl: string, fileName: string) {
  await assertCardMember(cardId, userId);
  const { rows } = await pool.query(
    `INSERT INTO attachments (card_id, uploaded_by_user_id, file_url, file_name)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [cardId, userId, fileUrl, fileName]
  );
  return rows[0];
}

export async function deleteAttachment(attachmentId: number, userId: number) {
  const { rows } = await pool.query(
    'SELECT * FROM attachments WHERE attachment_id = $1',
    [attachmentId]
  );
  if (rows.length === 0) throw new NotFoundError('Attachment not found');
  if (rows[0].uploaded_by_user_id !== userId) throw new ForbiddenError('Can only delete your own attachments');
  await pool.query('DELETE FROM attachments WHERE attachment_id = $1', [attachmentId]);
}
