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
import { Inject, Logger, UseGuards, forwardRef } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { RealtimeAuthService, SocketJwtPayload } from './realtime-auth.service';
import { RealtimeEventsService } from './realtime-events.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { DirectConversation, ProjectMember } from '../entities';
import { WsAuthGuard } from '../common/guards/ws-auth.guard';

interface SocketWithUser extends Socket {
  data: Socket['data'] & { user?: SocketJwtPayload };
}

@SkipThrottle()
@WebSocketGateway({
  namespace: '/realtime',
  transports: ['websocket', 'polling'],
  cors: {
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return cb(null, true);
      const env = process.env.CORS_ORIGINS || '';
      const allowed = env
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      if (process.env.NODE_ENV !== 'production') {
        allowed.push('http://localhost:3000', 'http://localhost:3001');
      }
      if (allowed.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed`));
    },
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly realtimeAuth: RealtimeAuthService,
    private readonly realtimeEvents: RealtimeEventsService,
    @Inject(forwardRef(() => ProjectAccessService))
    private readonly projectAccess: ProjectAccessService,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    @InjectRepository(DirectConversation)
    private readonly conversationsRepo: Repository<DirectConversation>,
  ) {}

  afterInit() {
    this.realtimeEvents.registerServer(this.server);
  }

  async handleConnection(client: SocketWithUser) {
    const hasAuthToken = !!client.handshake.auth?.token;
    const hasHeader = !!client.handshake.headers.authorization;
    this.logger.log(
      `Socket handshake (${client.id}): auth.token=${hasAuthToken}, header=${hasHeader}`,
    );

    try {
      const user = this.realtimeAuth.authenticate(client);
      client.data.user = user;

      const userRoom = this.realtimeEvents.userRoom(user.userId);
      client.join(userRoom);

      // Auto-join project rooms via TypeORM
      const projectMemberships = await this.membersRepo.find({
        where: { user_id: user.userId },
        select: { project_id: true },
      });
      for (const pm of projectMemberships) {
        client.join(this.realtimeEvents.projectRoom(pm.project_id));
      }

      // Conversation rooms are joined explicitly via room.conversation.join.

      this.logger.log(
        `Socket OK: user=${user.userId} email=${user.email} rooms=[${userRoom}, ${projectMemberships.length} projects] sid=${client.id}`,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Socket auth FAILED (${client.id}): ${reason}`);
      client.emit('auth_error', { message: reason });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: SocketWithUser) {
    const label = client.data.user
      ? `user ${client.data.user.userId}`
      : `unauthenticated ${client.id}`;
    this.logger.log(`Socket disconnected: ${label}`);
  }

  @UseGuards(WsAuthGuard)
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

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('room.conversation.join')
  async joinConversationRoom(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: { conversationId?: number },
  ) {
    try {
      const user = this.requireUser(client);
      const conversationId = Number(payload?.conversationId);
      this.logger.log(
        `room.conversation.join request: user=${user.userId}, conversationId=${conversationId}`,
      );

      if (!Number.isInteger(conversationId)) {
        this.logger.warn(
          `Invalid conversationId from user ${user.userId}: ${payload?.conversationId}`,
        );
        return { error: 'conversationId is required' };
      }

      const exists = await this.conversationsRepo
        .createQueryBuilder('dc')
        .where(
          'dc.conversation_id = :conversationId AND (dc.user_one_id = :userId OR dc.user_two_id = :userId)',
          { conversationId, userId: user.userId },
        )
        .getCount();

      if (!exists) {
        this.logger.warn(
          `Conversation ${conversationId} not found for user ${user.userId}`,
        );
        return { error: 'Conversation not found' };
      }

      const room = this.realtimeEvents.conversationRoom(conversationId);
      client.join(room);
      this.logger.log(
        `User ${user.userId} joined room ${room} (socket ${client.id})`,
      );
      return { conversationId, joined: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`room.conversation.join failed: ${msg}`);
      return { error: msg };
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('room.conversation.leave')
  async leaveConversationRoom(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: { conversationId?: number },
  ) {
    const user = this.requireUser(client);
    const conversationId = Number(payload?.conversationId);
    if (!Number.isInteger(conversationId)) {
      return { error: 'conversationId is required' };
    }
    const room = this.realtimeEvents.conversationRoom(conversationId);
    client.leave(room);
    this.logger.log(`User ${user.userId} left room ${room}`);
    return { conversationId, left: true };
  }

  private requireUser(client: SocketWithUser): SocketJwtPayload {
    const user = client.data.user;
    if (!user) throw new WsException('Unauthorized socket connection');
    return user;
  }
}
