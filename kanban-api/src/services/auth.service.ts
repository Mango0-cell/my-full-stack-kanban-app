import pool from '../config/db';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateToken } from '../utils/jwt';
import { ConflictError, AuthError } from '../utils/errors';

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const { email, password, displayName } = input;

  // Check uniqueness
  const existing = await pool.query(
    'SELECT user_id FROM users WHERE email = $1',
    [email]
  );
  if (existing.rows.length > 0) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await hashPassword(password);

  const { rows } = await pool.query(
    `INSERT INTO users (email, password, display_name)
     VALUES ($1, $2, $3)
     RETURNING user_id, email, display_name, created_at`,
    [email, passwordHash, displayName]
  );

  const user = rows[0];
  const token = generateToken(user.user_id, user.email);
  return { user, token };
}

export async function loginUser(input: LoginInput) {
  const { email, password } = input;

  const { rows } = await pool.query(
    'SELECT user_id, email, display_name, password FROM users WHERE email = $1',
    [email]
  );

  if (rows.length === 0) {
    throw new AuthError('Invalid email or password');
  }

  const user = rows[0];
  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new AuthError('Invalid email or password');
  }

  const token = generateToken(user.user_id, user.email);
  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
}

export async function getCurrentUser(userId: number) {
  const { rows } = await pool.query(
    `SELECT user_id, email, display_name, avatar_url, bio, theme, timezone, language,
            job_title, location, website_url, notification_settings, created_at, updated_at
     FROM users WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}
