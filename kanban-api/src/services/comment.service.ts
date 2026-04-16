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

export async function listComments(cardId: number, userId: number) {
  await assertCardMember(cardId, userId);
  const { rows } = await pool.query(
    `SELECT cm.*, u.display_name, u.avatar_url
     FROM comments cm
     JOIN users u ON u.user_id = cm.user_id
     WHERE cm.card_id = $1
     ORDER BY cm.created_at`,
    [cardId]
  );
  return rows;
}

export async function addComment(cardId: number, userId: number, content: string) {
  await assertCardMember(cardId, userId);
  const { rows } = await pool.query(
    `INSERT INTO comments (card_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [cardId, userId, content]
  );
  return rows[0];
}

export async function updateComment(commentId: number, userId: number, content: string) {
  const { rows } = await pool.query('SELECT * FROM comments WHERE comment_id = $1', [commentId]);
  if (rows.length === 0) throw new NotFoundError('Comment not found');
  if (rows[0].user_id !== userId) throw new ForbiddenError('Can only edit your own comments');

  const { rows: updated } = await pool.query(
    `UPDATE comments SET content = $1, updated_at = NOW() WHERE comment_id = $2 RETURNING *`,
    [content, commentId]
  );
  return updated[0];
}

export async function deleteComment(commentId: number, userId: number) {
  const { rows } = await pool.query('SELECT * FROM comments WHERE comment_id = $1', [commentId]);
  if (rows.length === 0) throw new NotFoundError('Comment not found');
  if (rows[0].user_id !== userId) throw new ForbiddenError('Can only delete your own comments');
  await pool.query('DELETE FROM comments WHERE comment_id = $1', [commentId]);
}
