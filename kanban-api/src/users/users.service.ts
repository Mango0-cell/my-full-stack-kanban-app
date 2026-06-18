import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import * as bcrypt from 'bcrypt';
import { User } from '../entities';

const SAFE_FIELDS: (keyof User)[] = [
  'user_id',
  'email',
  'display_name',
  'avatar_url',
  'bio',
  'theme',
  'timezone',
  'language',
  'job_title',
  'location',
  'website_url',
  'notification_settings',
  'created_at',
  'updated_at',
];

const PUBLIC_FIELDS: (keyof User)[] = [
  'user_id',
  'email',
  'display_name',
  'avatar_url',
  'bio',
  'job_title',
  'location',
  'website_url',
  'created_at',
];

const ALLOWED_UPDATE_FIELDS = new Set<keyof User>([
  'display_name',
  'avatar_url',
  'bio',
  'theme',
  'timezone',
  'language',
  'job_title',
  'location',
  'website_url',
  'notification_settings',
]);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async getProfile(userId: number) {
    return (
      (await this.usersRepo.findOne({
        where: { user_id: userId },
        select: SAFE_FIELDS.reduce<Record<string, true>>((acc, k) => {
          acc[k] = true;
          return acc;
        }, {}),
      })) || null
    );
  }

  async searchUsersByEmail(currentUserId: number, email: string) {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return [];
    return this.usersRepo.find({
      where: {
        user_id: Not(currentUserId),
        email: ILike(`%${normalized}%`),
      },
      select: { user_id: true, email: true, display_name: true, avatar_url: true },
      order: { email: 'ASC' },
      take: 10,
    });
  }

  async getPublicProfile(userId: number) {
    const user = await this.usersRepo.findOne({
      where: { user_id: userId },
      select: PUBLIC_FIELDS.reduce<Record<string, true>>((acc, k) => {
        acc[k] = true;
        return acc;
      }, {}),
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: number, updates: Record<string, unknown>) {
    const filteredUpdates: Partial<User> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (ALLOWED_UPDATE_FIELDS.has(k as keyof User)) {
        (filteredUpdates as Record<string, unknown>)[k] = v;
      }
    }
    if (Object.keys(filteredUpdates).length === 0) {
      return this.getProfile(userId);
    }
    await this.usersRepo.update(
      { user_id: userId },
      filteredUpdates as QueryDeepPartialEntity<User>,
    );
    return this.getProfile(userId);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.usersRepo.findOne({
      where: { user_id: userId },
      select: { password: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const rounds = parseInt(String(this.config.get('BCRYPT_ROUNDS', '12')), 10);
    const newHash = await bcrypt.hash(newPassword, rounds);
    await this.usersRepo.update({ user_id: userId }, { password: newHash });
  }

  async deleteAccount(userId: number, password: string) {
    const user = await this.usersRepo.findOne({
      where: { user_id: userId },
      select: { password: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Password confirmation failed');

    await this.usersRepo.delete({ user_id: userId });
  }
}
