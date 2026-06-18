import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from '../entities';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string, displayName: string) {
    const normalizedEmail = email.toLowerCase();
    this.logger.log(`Register attempt: ${normalizedEmail}`);

    const existing = await this.usersRepo.findOne({
      where: { email: normalizedEmail },
      select: { user_id: true },
    });
    if (existing) throw new ConflictException('Email already registered');

    const rounds = parseInt(String(this.config.get('BCRYPT_ROUNDS', '12')), 10);
    const passwordHash = await bcrypt.hash(password, rounds);

    const entity = this.usersRepo.create({
      email: normalizedEmail,
      password: passwordHash,
      display_name: displayName,
    });
    const saved = await this.usersRepo.save(entity);

    const user = {
      user_id: saved.user_id,
      email: saved.email,
      display_name: saved.display_name,
      created_at: saved.created_at,
    };
    const token = this.generateToken(user.user_id, user.email);
    this.logger.log(`Register success: ${normalizedEmail}`);
    return { user, token };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase();
    this.logger.log(`Login attempt: ${normalizedEmail}`);

    const user = await this.usersRepo.findOne({
      where: { email: normalizedEmail },
      select: {
        user_id: true,
        email: true,
        display_name: true,
        password: true,
      },
    });
    if (!user) {
      this.logger.warn(`Login failed (no user): ${normalizedEmail}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      this.logger.warn(`Login failed (bad password): ${normalizedEmail}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user.user_id, user.email);
    const { password: _drop, ...safeUser } = user;
    void _drop;
    this.logger.log(`Login success: ${normalizedEmail}`);
    return { user: safeUser, token };
  }

  async getCurrentUser(userId: number, email: string) {
    return (
      (await this.usersRepo.findOne({
        where: { user_id: userId, email: email.toLowerCase() },
        select: {
          user_id: true,
          email: true,
          display_name: true,
          avatar_url: true,
          bio: true,
          theme: true,
          timezone: true,
          language: true,
          job_title: true,
          location: true,
          website_url: true,
          notification_settings: true,
          created_at: true,
          updated_at: true,
        },
      })) || null
    );
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
