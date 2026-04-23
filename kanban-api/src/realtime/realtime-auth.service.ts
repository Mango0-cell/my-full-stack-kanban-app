import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';

export interface SocketJwtPayload {
  userId: number;
  email: string;
}

@Injectable()
export class RealtimeAuthService {
  constructor(private readonly config: ConfigService) {}

  authenticate(client: Socket): SocketJwtPayload {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    try {
      const decoded = jwt.verify(token, secret) as SocketJwtPayload;
      return { userId: decoded.userId, email: decoded.email };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return null;
  }
}
