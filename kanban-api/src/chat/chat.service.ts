import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {}

  async listConversations(userId: number) {
    const { rows } = await this.db.query(
      `SELECT dc.conversation_id,
              dc.updated_at,
              CASE WHEN dc.user_one_id = $1 THEN dc.user_two_id ELSE dc.user_one_id END AS other_user_id,
              u.email AS other_user_email,
              u.display_name AS other_user_display_name,
              u.avatar_url AS other_user_avatar_url,
              lm.message_id AS last_message_id,
              lm.content AS last_message_content,
              lm.sender_user_id AS last_message_sender_user_id,
              lm.created_at AS last_message_created_at
       FROM direct_conversations dc
       JOIN users u
         ON u.user_id = CASE WHEN dc.user_one_id = $1 THEN dc.user_two_id ELSE dc.user_one_id END
       LEFT JOIN LATERAL (
         SELECT dm.message_id, dm.content, dm.sender_user_id, dm.created_at
         FROM direct_messages dm
         WHERE dm.conversation_id = dc.conversation_id
         ORDER BY dm.created_at DESC
         LIMIT 1
       ) lm ON TRUE
       WHERE dc.user_one_id = $1 OR dc.user_two_id = $1
       ORDER BY COALESCE(lm.created_at, dc.updated_at) DESC`,
      [userId],
    );

    return rows;
  }

  async listMessages(conversationId: number, userId: number) {
    await this.assertConversationMember(conversationId, userId);

    const { rows } = await this.db.query(
      `SELECT dm.message_id,
              dm.conversation_id,
              dm.sender_user_id,
              dm.content,
              dm.created_at,
              u.display_name AS sender_display_name,
              u.avatar_url AS sender_avatar_url
       FROM direct_messages dm
       JOIN users u ON u.user_id = dm.sender_user_id
       WHERE dm.conversation_id = $1
       ORDER BY dm.created_at ASC`,
      [conversationId],
    );

    return rows;
  }

  async sendMessage(input: {
    senderUserId: number;
    content: string;
    recipientUserId?: number;
    conversationId?: number;
  }) {
    const content = input.content.trim();
    if (!content) {
      throw new BadRequestException('Message content is required');
    }

    let conversationId = input.conversationId;
    let recipientUserId = input.recipientUserId;

    if (!conversationId && !recipientUserId) {
      throw new BadRequestException('recipient_user_id or conversation_id is required');
    }

    if (!conversationId && recipientUserId) {
      await this.assertUserExists(recipientUserId);
      conversationId = await this.findOrCreateConversation(input.senderUserId, recipientUserId);
    }

    if (!conversationId) {
      throw new BadRequestException('Conversation resolution failed');
    }

    const members = await this.getConversationMembers(conversationId);
    if (!members.includes(input.senderUserId)) {
      throw new ForbiddenException('Not authorized to send message in this conversation');
    }

    if (!recipientUserId) {
      recipientUserId = members.find((member) => member !== input.senderUserId);
    }

    if (!recipientUserId) {
      throw new BadRequestException('Direct conversation recipient not found');
    }

    const { rows } = await this.db.query(
      `INSERT INTO direct_messages (conversation_id, sender_user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [conversationId, input.senderUserId, content],
    );

    await this.db.query(
      'UPDATE direct_conversations SET updated_at = NOW() WHERE conversation_id = $1',
      [conversationId],
    );

    const message = rows[0];
    this.realtimeEvents.emitToConversation(conversationId, 'chat.message.received', message);
    this.realtimeEvents.emitToUser(input.senderUserId, 'chat.message.sent', message);

    await this.notificationsService.createNotification({
      userId: recipientUserId,
      type: 'chat_message',
      title: 'New direct message',
      body: content.length > 80 ? `${content.slice(0, 77)}...` : content,
      entityType: 'conversation',
      entityId: conversationId,
      metadata: {
        conversation_id: conversationId,
        sender_user_id: input.senderUserId,
      },
    });

    return message;
  }

  private async findOrCreateConversation(senderUserId: number, recipientUserId: number) {
    if (senderUserId === recipientUserId) {
      throw new BadRequestException('Cannot send direct message to yourself');
    }

    const [userOneId, userTwoId] = [senderUserId, recipientUserId].sort((a, b) => a - b);

    const { rows } = await this.db.query(
      `INSERT INTO direct_conversations (user_one_id, user_two_id)
       VALUES ($1, $2)
       ON CONFLICT (user_one_id, user_two_id)
       DO UPDATE SET updated_at = NOW()
       RETURNING conversation_id`,
      [userOneId, userTwoId],
    );

    return rows[0].conversation_id as number;
  }

  private async assertConversationMember(conversationId: number, userId: number) {
    const { rows } = await this.db.query(
      `SELECT 1
       FROM direct_conversations
       WHERE conversation_id = $1 AND (user_one_id = $2 OR user_two_id = $2)`,
      [conversationId, userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Conversation not found');
    }
  }

  private async assertUserExists(userId: number) {
    const { rows } = await this.db.query(
      'SELECT 1 FROM users WHERE user_id = $1',
      [userId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Recipient user not found');
    }
  }

  private async getConversationMembers(conversationId: number): Promise<number[]> {
    const { rows } = await this.db.query(
      `SELECT user_one_id, user_two_id
       FROM direct_conversations
       WHERE conversation_id = $1`,
      [conversationId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Conversation not found');
    }

    return [rows[0].user_one_id, rows[0].user_two_id] as number[];
  }
}
