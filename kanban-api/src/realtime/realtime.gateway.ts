import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RealtimeAuthService, SocketJwtPayload } from './realtime-auth.service';
import { RealtimeEventsService } from './realtime-events.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { DatabaseService } from '../database/database.service';

interface SocketWithUser extends Socket {
  data: Socket['data'] & { user?: SocketJwtPayload };
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly realtimeAuth: RealtimeAuthService,
    private readonly realtimeEvents: RealtimeEventsService,
    private readonly projectAccess: ProjectAccessService,
    private readonly db: DatabaseService,
  ) {}

  afterInit() {
    this.realtimeEvents.registerServer(this.server);
  }

  async handleConnection(client: SocketWithUser) {
    try {
      const user = this.realtimeAuth.authenticate(client);
      client.data.user = user;
      client.join(this.realtimeEvents.userRoom(user.userId));
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: SocketWithUser) {
    if (client.data.user) {
      this.logger.debug(`Socket disconnected for user ${client.data.user.userId}`);
    }
  }

  @SubscribeMessage('room.project.join')
  async joinProjectRoom(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: { projectId?: number },
  ) {
    const user = this.requireUser(client);
    const projectId = Number(payload?.projectId);

    if (!Number.isInteger(projectId)) {
      throw new WsException('projectId is required');
    }

    await this.projectAccess.assertMember(projectId, user.userId);
    client.join(this.realtimeEvents.projectRoom(projectId));

    return { projectId, joined: true };
  }

  @SubscribeMessage('room.conversation.join')
  async joinConversationRoom(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: { conversationId?: number },
  ) {
    const user = this.requireUser(client);
    const conversationId = Number(payload?.conversationId);

    if (!Number.isInteger(conversationId)) {
      throw new WsException('conversationId is required');
    }

    const { rows } = await this.db.query(
      `SELECT 1
       FROM direct_conversations
       WHERE conversation_id = $1 AND (user_one_id = $2 OR user_two_id = $2)`,
      [conversationId, user.userId],
    );

    if (rows.length === 0) {
      throw new WsException('Conversation not found');
    }

    client.join(this.realtimeEvents.conversationRoom(conversationId));
    return { conversationId, joined: true };
  }

  private requireUser(client: SocketWithUser): SocketJwtPayload {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Unauthorized socket connection');
    }
    return user;
  }
}
