import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeEventsService {
  private server: Server | null = null;
  private readonly logger = new Logger(RealtimeEventsService.name);

  registerServer(server: Server) {
    this.server = server;
    this.logger.log('Socket.IO server registered');
  }

  emitToUser(userId: number, event: string, payload: unknown) {
    const room = this.userRoom(userId);
    if (!this.server) {
      this.logger.warn(`emitToUser(${room}, ${event}): server not registered`);
      return;
    }
    this.server.in(room).fetchSockets().then((sockets) => {
      this.logger.log(`emitToUser → ${room} :: ${event} (${sockets.length} sockets in room)`);
    }).catch(() => {});
    this.server.to(room).emit(event, payload);
  }

  emitToProject(projectId: number, event: string, payload: unknown) {
    const room = this.projectRoom(projectId);
    if (!this.server) {
      this.logger.warn(`emitToProject(${room}, ${event}): server not registered`);
      return;
    }
    this.server.to(room).emit(event, payload);
    this.logger.log(`emitToProject → ${room} :: ${event}`);
  }

  emitToConversation(conversationId: number, event: string, payload: unknown) {
    const room = this.conversationRoom(conversationId);
    if (!this.server) {
      this.logger.warn(`emitToConversation(${room}, ${event}): server not registered`);
      return;
    }
    this.server.in(room).fetchSockets().then((clients) => {
      this.logger.log(`emitToConversation → ${room} :: ${event} (${clients.length} sockets in room)`);
    }).catch(() => {});
    this.server.to(room).emit(event, payload);
  }

  /**
   * Check if a specific user has any connected sockets in a given room.
   * Used to suppress notifications when the user is actively viewing a chat.
   */
  async isUserInRoom(room: string, userId: number): Promise<boolean> {
    if (!this.server) return false;
    try {
      const sockets = await this.server.in(room).fetchSockets();
      return sockets.some((s) => s.data?.user?.userId === userId);
    } catch {
      return false;
    }
  }

  userRoom(userId: number) {
    return `user:${userId}`;
  }

  projectRoom(projectId: number) {
    return `project:${projectId}`;
  }

  conversationRoom(conversationId: number) {
    return `conversation:${conversationId}`;
  }
}
