import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

interface CreateNotificationInput {
  userId: number;
  type: string;
  title: string;
  body: string;
  entityType?: string | null;
  entityId?: number | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {}

  async createNotification(input: CreateNotificationInput) {
    const { rows } = await this.db.query(
      `INSERT INTO notifications (
        user_id, type, title, body, entity_type, entity_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        input.userId,
        input.type,
        input.title,
        input.body,
        input.entityType || null,
        input.entityId || null,
        input.metadata ? JSON.stringify(input.metadata) : JSON.stringify({}),
      ],
    );

    const notification = rows[0];
    this.realtimeEvents.emitToUser(input.userId, 'notification.received', notification);
    return notification;
  }

  async listNotifications(userId: number, limit = 5) {
    const safeLimit = limit === 10 ? 10 : 5;
    const { rows } = await this.db.query(
      `SELECT *
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, safeLimit],
    );

    return rows;
  }

  async markAsRead(userId: number, notificationId: number) {
    const { rows } = await this.db.query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Notification not found');
    }

    const notification = rows[0];
    this.realtimeEvents.emitToUser(userId, 'notification.read', {
      notification_id: notification.notification_id,
    });

    return notification;
  }
}
