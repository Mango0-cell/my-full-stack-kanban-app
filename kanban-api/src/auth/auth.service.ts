import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private db: DatabaseService,
    private config: ConfigService,
  ) {}

  async register(email: string, password: string, displayName: string) {
    this.logger.log(`Register attempt: ${email}`);

    const existing = await this.db.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email.toLowerCase()],
    );
    if (existing.rows.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const rounds = parseInt(String(this.config.get('BCRYPT_ROUNDS', '12')), 10);
    const passwordHash = await bcrypt.hash(password, rounds);

    const { rows } = await this.db.query(
      `INSERT INTO users (email, password, display_name)
       VALUES ($1, $2, $3)
       RETURNING user_id, email, display_name, created_at`,
      [email.toLowerCase(), passwordHash, displayName],
    );

    const user = rows[0];
    const token = this.generateToken(user.user_id, user.email);
    this.logger.log(`Register success: ${email}`);
    return { user, token };
  }

  async login(email: string, password: string) {
    this.logger.log(`Login attempt: ${email}`);

    const { rows } = await this.db.query(
      'SELECT user_id, email, display_name, password FROM users WHERE email = $1',
      [email.toLowerCase()],
    );

    if (rows.length === 0) {
      this.logger.warn(`Login failed (no user): ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      this.logger.warn(`Login failed (bad password): ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user.user_id, user.email);
    const { password: _, ...safeUser } = user;
    this.logger.log(`Login success: ${email}`);
    return { user: safeUser, token };
  }

  async getCurrentUser(userId: number, email: string) {
    const { rows } = await this.db.query(
      `SELECT user_id, email, display_name, avatar_url, bio, theme, timezone, language,
               job_title, location, website_url, notification_settings, created_at, updated_at
       FROM users WHERE user_id = $1 AND email = $2`,
      [userId, email.toLowerCase()],
    );
    return rows[0] || null;
  }

  private generateToken(userId: number, email: string): string {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET not configured');
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '7d');
    return jwt.sign({ userId, email }, secret, {
      algorithm: 'HS256',
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    });
  }
}
