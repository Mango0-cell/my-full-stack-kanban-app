import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardColumn, Card, ProjectMember } from '../entities';

@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    @InjectRepository(BoardColumn)
    private readonly columnsRepo: Repository<BoardColumn>,
    @InjectRepository(Card)
    private readonly cardsRepo: Repository<Card>,
  ) {}

  async assertMember(projectId: number, userId: number) {
    const row = await this.membersRepo
      .createQueryBuilder('pm')
      .innerJoin('pm.role', 'r')
      .where('pm.project_id = :projectId AND pm.user_id = :userId', { projectId, userId })
      .select(['pm.role_id AS role_id', 'r.role_name AS role_name'])
      .getRawOne<{ role_id: number; role_name: string }>();

    if (!row) throw new ForbiddenException('Not a member of this project');
    return row;
  }

  async assertOwnerOrAdmin(projectId: number, userId: number) {
    const member = await this.assertMember(projectId, userId);
    if (member.role_name !== 'owner' && member.role_name !== 'admin') {
      throw new ForbiddenException('Requires owner or admin role');
    }
    return member;
  }

  private readonly editBoardRoles = new Set(['owner', 'admin', 'editor', 'member']);

  async assertCanEditBoard(projectId: number, userId: number) {
    const member = await this.assertMember(projectId, userId);
    if (!this.editBoardRoles.has(member.role_name)) {
      throw new ForbiddenException('Requires owner, admin, or editor role');
    }
    return member;
  }

  async getProjectIdFromColumn(columnId: number): Promise<number> {
    const col = await this.columnsRepo.findOne({
      where: { column_id: columnId },
      select: { project_id: true },
    });
    if (!col) throw new NotFoundException('Column not found');
    return col.project_id;
  }

  async getProjectIdFromCard(cardId: number): Promise<number> {
    const row = await this.cardsRepo
      .createQueryBuilder('c')
      .innerJoin('c.column', 'col')
      .where('c.card_id = :cardId', { cardId })
      .select('col.project_id', 'project_id')
      .getRawOne<{ project_id: number }>();
    if (!row) throw new NotFoundException('Card not found');
    return row.project_id;
  }
}
