import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';

const SAFE_FIELDS = `user_id, email, display_name, avatar_url, bio, theme, timezone, language,
  job_title, location, website_url, notification_settings, created_at, updated_at`;

@Injectable()
export class UsersService {
  constructor(
    private db: DatabaseService,
    private config: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getProfile(userId: number) {
    const { rows } = await this.db.query(
      `SELECT ${SAFE_FIELDS} FROM users WHERE user_id = $1`,
      [userId],
    );
    return rows[0] || null;
  }

  async searchUsersByEmail(currentUserId: number, email: string) {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return [];

    const { rows } = await this.db.query(
      `SELECT user_id, email, display_name, avatar_url
       FROM users
       WHERE user_id != $1 AND email ILIKE $2
       ORDER BY email ASC
       LIMIT 10`,
      [currentUserId, `%${normalized}%`],
    );

    return rows;
  }

  async followUser(followerUserId: number, followedUserId: number, label?: string) {
    if (followerUserId === followedUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const followedUser = await this.db.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [followedUserId],
    );

    if (followedUser.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const normalizedLabel = (label || 'following').trim() || 'following';

    const { rows } = await this.db.query(
      `INSERT INTO user_follows (follower_user_id, followed_user_id, label)
       VALUES ($1, $2, $3)
       ON CONFLICT (follower_user_id, followed_user_id)
       DO UPDATE SET label = EXCLUDED.label, updated_at = NOW()
       RETURNING *`,
      [followerUserId, followedUserId, normalizedLabel],
    );

    await this.notificationsService.createNotification({
      userId: followedUserId,
      type: 'user_followed',
      title: 'New follower label',
      body: `A user followed you with label: ${normalizedLabel}`,
      entityType: 'user',
      entityId: followerUserId,
      metadata: { follower_user_id: followerUserId },
    });

    return rows[0];
  }

  async updateProfile(userId: number, updates: Record<string, unknown>) {
    const allowed = [
      'display_name', 'avatar_url', 'bio', 'theme', 'timezone', 'language',
      'job_title', 'location', 'website_url', 'notification_settings',
    ];

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

    if (fields.length === 0) return this.getProfile(userId);

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const { rows } = await this.db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${idx} RETURNING ${SAFE_FIELDS}`,
      values,
    );
    return rows[0];
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const { rows } = await this.db.query(
      'SELECT password FROM users WHERE user_id = $1',
      [userId],
    );
    if (rows.length === 0) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const rounds = parseInt(String(this.config.get('BCRYPT_ROUNDS', '12')), 10);
    const newHash = await bcrypt.hash(newPassword, rounds);
    await this.db.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2',
      [newHash, userId],
    );
  }

  async deleteAccount(userId: number, password: string) {
    const { rows } = await this.db.query(
      'SELECT password FROM users WHERE user_id = $1',
      [userId],
    );
    if (rows.length === 0) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) throw new UnauthorizedException('Password confirmation failed');

    await this.db.query('DELETE FROM users WHERE user_id = $1', [userId]);
  }
}
