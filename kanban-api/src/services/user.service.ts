import pool from '../config/db';
import { hashPassword, comparePassword } from '../utils/crypto';
import { AuthError, NotFoundError } from '../utils/errors';

const SAFE_FIELDS = `user_id, email, display_name, avatar_url, bio, theme, timezone, language,
  job_title, location, website_url, notification_settings, created_at, updated_at`;

export async function getProfile(userId: number) {
  const { rows } = await pool.query(
    `SELECT ${SAFE_FIELDS} FROM users WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

export async function updateProfile(userId: number, updates: Record<string, unknown>) {
  const allowed = ['display_name', 'avatar_url', 'bio', 'theme', 'timezone', 'language',
    'job_title', 'location', 'website_url', 'notification_settings'];

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const key of allowed) {
    if (key in updates) {
      fields.push(`${key} = $${idx}`);
      values.push(updates[key]);
      idx++;
    }
  }

  if (fields.length === 0) return getProfile(userId);

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${idx} RETURNING ${SAFE_FIELDS}`,
    values
  );
  return rows[0];
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  const { rows } = await pool.query(
    'SELECT password FROM users WHERE user_id = $1',
    [userId]
  );
  if (rows.length === 0) throw new NotFoundError('User not found');

  const valid = await comparePassword(currentPassword, rows[0].password);
  if (!valid) throw new AuthError('Current password is incorrect');

  const newHash = await hashPassword(newPassword);
  await pool.query(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2',
    [newHash, userId]
  );
}

export async function deleteAccount(userId: number, password: string) {
  const { rows } = await pool.query(
    'SELECT password FROM users WHERE user_id = $1',
    [userId]
  );
  if (rows.length === 0) throw new NotFoundError('User not found');

  const valid = await comparePassword(password, rows[0].password);
  if (!valid) throw new AuthError('Password confirmation failed');

  await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
}
