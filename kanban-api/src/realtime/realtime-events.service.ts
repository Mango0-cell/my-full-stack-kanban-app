import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeEventsService {
  private server: Server | null = null;

  registerServer(server: Server) {
    this.server = server;
  }

  emitToUser(userId: number, event: string, payload: unknown) {
    this.server?.to(this.userRoom(userId)).emit(event, payload);
  }

  emitToProject(projectId: number, event: string, payload: unknown) {
    this.server?.to(this.projectRoom(projectId)).emit(event, payload);
  }

  emitToConversation(conversationId: number, event: string, payload: unknown) {
    this.server?.to(this.conversationRoom(conversationId)).emit(event, payload);
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
