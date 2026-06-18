import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities';
import { RolePolicyService } from '../common/policies/role-policy.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
    private readonly rolePolicy: RolePolicyService,
  ) {}

  private async getCommentProject(commentId: number): Promise<number> {
    const row = await this.commentsRepo
      .createQueryBuilder('cm')
      .innerJoin('cm.card', 'c')
      .innerJoin('c.column', 'col')
      .where('cm.comment_id = :id', { id: commentId })
      .select('col.project_id', 'project_id')
      .getRawOne<{ project_id: number }>();
    if (!row) throw new NotFoundException('Comment not found');
    return row.project_id;
  }

  async listComments(cardId: number, userId: number) {
    const projectId = await this.rolePolicy.getCardProjectId(cardId);
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    return this.commentsRepo
      .createQueryBuilder('cm')
      .innerJoin('cm.user', 'u')
      .where('cm.card_id = :cardId', { cardId })
      .orderBy('cm.created_at', 'ASC')
      .select([
        'cm.comment_id AS comment_id',
        'cm.card_id AS card_id',
        'cm.user_id AS user_id',
        'cm.content AS content',
        'cm.created_at AS created_at',
        'cm.updated_at AS updated_at',
        'u.display_name AS display_name',
        'u.avatar_url AS avatar_url',
      ])
      .getRawMany();
  }

  async addComment(cardId: number, userId: number, content: string) {
    const projectId = await this.rolePolicy.getCardProjectId(cardId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);
    const entity = this.commentsRepo.create({
      card_id: cardId,
      user_id: userId,
      content,
    });
    return this.commentsRepo.save(entity);
  }

  async updateComment(commentId: number, userId: number, content: string) {
    const projectId = await this.getCommentProject(commentId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);
    const comment = await this.commentsRepo.findOne({ where: { comment_id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    comment.content = content;
    return this.commentsRepo.save(comment);
  }

  async deleteComment(commentId: number, userId: number) {
    const projectId = await this.getCommentProject(commentId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);
    await this.commentsRepo.delete(commentId);
  }
}
