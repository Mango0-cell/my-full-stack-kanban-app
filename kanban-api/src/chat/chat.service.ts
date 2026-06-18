import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DirectConversation, DirectMessage, User } from '../entities';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(DirectConversation)
    private readonly conversationsRepo: Repository<DirectConversation>,
    @InjectRepository(DirectMessage)
    private readonly messagesRepo: Repository<DirectMessage>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {}

  async listConversations(userId: number) {
    // LEFT JOIN LATERAL is best expressed as raw SQL via the DataSource.
    return this.dataSource.query(
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
  }

  async listMessages(conversationId: number, userId: number) {
    await this.assertConversationMember(conversationId, userId);

    return this.messagesRepo
      .createQueryBuilder('dm')
      .innerJoin('dm.sender', 'u')
      .where('dm.conversation_id = :conversationId', { conversationId })
      .orderBy('dm.created_at', 'ASC')
      .select([
        'dm.message_id AS message_id',
        'dm.conversation_id AS conversation_id',
        'dm.sender_user_id AS sender_user_id',
        'dm.content AS content',
        'dm.created_at AS created_at',
        'u.display_name AS sender_display_name',
        'u.avatar_url AS sender_avatar_url',
      ])
      .getRawMany();
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

    const entity = this.messagesRepo.create({
      conversation_id: conversationId,
      sender_user_id: input.senderUserId,
      content,
    });
    const savedMessage = await this.messagesRepo.save(entity);

    await this.conversationsRepo.update(
      { conversation_id: conversationId },
      { updated_at: new Date() },
    );

    const sender = await this.usersRepo.findOne({
      where: { user_id: input.senderUserId },
      select: { display_name: true, avatar_url: true },
    });

    const message = {
      ...savedMessage,
      sender_display_name: sender?.display_name ?? null,
      sender_avatar_url: sender?.avatar_url ?? null,
    };

    this.realtimeEvents.emitToConversation(conversationId, 'chat.message.received', message);
    this.realtimeEvents.emitToUser(recipientUserId, 'chat.message.received', message);
    this.realtimeEvents.emitToUser(input.senderUserId, 'chat.message.sent', message);

    const convRoom = this.realtimeEvents.conversationRoom(conversationId);
    const recipientViewingChat = await this.realtimeEvents.isUserInRoom(
      convRoom,
      recipientUserId,
    );
    if (!recipientViewingChat) {
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
    }

    return message;
  }

  async deleteConversation(conversationId: number, userId: number) {
    await this.assertConversationMember(conversationId, userId);
    await this.conversationsRepo.delete({ conversation_id: conversationId });
  }

  async findOrCreatePublic(senderUserId: number, recipientUserId: number) {
    return this.findOrCreateConversation(senderUserId, recipientUserId);
  }

  private async findOrCreateConversation(senderUserId: number, recipientUserId: number) {
    if (senderUserId === recipientUserId) {
      throw new BadRequestException('Cannot send direct message to yourself');
    }

    const [userOneId, userTwoId] = [senderUserId, recipientUserId].sort((a, b) => a - b);

    // ON CONFLICT requires raw SQL — keeps the original UPSERT semantics.
    const rows = (await this.dataSource.query(
      `INSERT INTO direct_conversations (user_one_id, user_two_id)
       VALUES ($1, $2)
       ON CONFLICT (user_one_id, user_two_id)
       DO UPDATE SET updated_at = NOW()
       RETURNING conversation_id`,
      [userOneId, userTwoId],
    )) as { conversation_id: number }[];

    return rows[0].conversation_id;
  }

  private async assertConversationMember(conversationId: number, userId: number) {
    const exists = await this.conversationsRepo
      .createQueryBuilder('dc')
      .where(
        'dc.conversation_id = :conversationId AND (dc.user_one_id = :userId OR dc.user_two_id = :userId)',
        { conversationId, userId },
      )
      .getCount();
    if (!exists) throw new NotFoundException('Conversation not found');
  }

  private async assertUserExists(userId: number) {
    const exists = await this.usersRepo.count({ where: { user_id: userId } });
    if (!exists) throw new NotFoundException('Recipient user not found');
  }

  private async getConversationMembers(conversationId: number): Promise<number[]> {
    const conv = await this.conversationsRepo.findOne({
      where: { conversation_id: conversationId },
      select: { user_one_id: true, user_two_id: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return [conv.user_one_id, conv.user_two_id];
  }
}
