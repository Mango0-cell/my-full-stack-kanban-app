import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities';
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
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {}

  async createNotification(input: CreateNotificationInput) {
    const entity = this.notificationsRepo.create({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
    const notification = await this.notificationsRepo.save(entity);
    this.realtimeEvents.emitToUser(input.userId, 'notification.received', notification);
    return notification;
  }

  async listNotifications(userId: number, limit = 5) {
    const safeLimit = limit === 10 ? 10 : 5;
    return this.notificationsRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: safeLimit,
    });
  }

  async markAsRead(userId: number, notificationId: number) {
    const notification = await this.notificationsRepo.findOne({
      where: { notification_id: notificationId, user_id: userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.is_read = true;
    notification.read_at = new Date();
    const updated = await this.notificationsRepo.save(notification);

    this.realtimeEvents.emitToUser(userId, 'notification.read', {
      notification_id: updated.notification_id,
    });
    return updated;
  }
}
