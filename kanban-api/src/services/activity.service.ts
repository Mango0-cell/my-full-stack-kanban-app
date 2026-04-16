import pool from '../config/db';
import { ForbiddenError } from '../utils/errors';

export async function getCardActivity(cardId: number, userId: number) {
  const { rows: memberRows } = await pool.query(
    `SELECT 1 FROM cards c
     JOIN columns col ON col.column_id = c.column_id
     JOIN project_members pm ON pm.project_id = col.project_id
     WHERE c.card_id = $1 AND pm.user_id = $2`,
    [cardId, userId]
  );
  if (memberRows.length === 0) throw new ForbiddenError('Not authorized to access this card');

  const { rows } = await pool.query(
    `SELECT a.*, u.display_name, u.avatar_url
     FROM card_activity a
     JOIN users u ON u.user_id = a.user_id
     WHERE a.card_id = $1
     ORDER BY a.created_at DESC`,
    [cardId]
  );
  return rows;
}
