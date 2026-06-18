import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardActivity } from '../entities';
import { RolePolicyService } from '../common/policies/role-policy.service';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(CardActivity)
    private readonly activityRepo: Repository<CardActivity>,
    private readonly rolePolicy: RolePolicyService,
  ) {}

  async getCardActivity(cardId: number, userId: number) {
    const projectId = await this.rolePolicy.getCardProjectId(cardId);
    await this.rolePolicy.assertProjectReadable(projectId, userId);

    return this.activityRepo
      .createQueryBuilder('a')
      .leftJoin('a.user', 'u')
      .where('a.card_id = :cardId', { cardId })
      .orderBy('a.created_at', 'DESC')
      .select([
        'a.activity_id AS activity_id',
        'a.card_id AS card_id',
        'a.user_id AS user_id',
        'a.action_type AS action_type',
        'a.old_value AS old_value',
        'a.new_value AS new_value',
        'a.created_at AS created_at',
        'u.display_name AS display_name',
        'u.avatar_url AS avatar_url',
      ])
      .getRawMany();
  }
}
