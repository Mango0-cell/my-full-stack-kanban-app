import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * Guard for @SubscribeMessage handlers.
 * Verifies the socket was authenticated during handleConnection
 * (i.e. client.data.user was set by RealtimeGateway).
 *
 * Usage:
 *   @UseGuards(WsAuthGuard)
 *   @SubscribeMessage('some.event')
 *   handleEvent(@ConnectedSocket() client: Socket) { ... }
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'ws') return true;

    const client = context.switchToWs().getClient<Socket>();
    const user = client.data?.user;

    if (!user || typeof user.userId !== 'number') {
      throw new WsException('Unauthorized: socket not authenticated');
    }

    return true;
  }
}
