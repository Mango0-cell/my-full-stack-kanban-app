import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardColumn, Card, ProjectMember } from '../../entities';

type ProjectRole = 'owner' | 'admin' | 'editor' | 'member' | 'viewer';

export interface ProjectMembershipContext {
  project_id: number;
  owner_user_id: number;
  role_name: ProjectRole;
}

@Injectable()
export class RolePolicyService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    @InjectRepository(BoardColumn)
    private readonly columnsRepo: Repository<BoardColumn>,
    @InjectRepository(Card)
    private readonly cardsRepo: Repository<Card>,
  ) {}

  private readonly boardWriteRoles = new Set<ProjectRole>([
    'owner',
    'admin',
    'editor',
    'member',
  ]);
  private readonly collaboratorManagerRoles = new Set<ProjectRole>(['owner', 'admin']);
  private readonly privilegedRoles = new Set<ProjectRole>(['owner', 'admin']);

  async getProjectMembership(
    projectId: number,
    userId: number,
  ): Promise<ProjectMembershipContext> {
    const row = await this.membersRepo
      .createQueryBuilder('pm')
      .innerJoin('pm.project', 'p')
      .innerJoin('pm.role', 'r')
      .where('p.project_id = :projectId AND pm.user_id = :userId', { projectId, userId })
      .select([
        'p.project_id AS project_id',
        'p.owner_user_id AS owner_user_id',
        'r.role_name AS role_name',
      ])
      .getRawOne<ProjectMembershipContext>();

    if (!row) throw new ForbiddenException('Not a member of this project');
    return row;
  }

  async assertProjectReadable(projectId: number, userId: number) {
    return this.getProjectMembership(projectId, userId);
  }

  async assertProjectBoardWrite(projectId: number, userId: number) {
    const membership = await this.getProjectMembership(projectId, userId);
    if (!this.boardWriteRoles.has(membership.role_name)) {
      throw new ForbiddenException('Requires editor or admin role');
    }
    return membership;
  }

  async assertProjectCollaboratorManage(projectId: number, userId: number) {
    const membership = await this.getProjectMembership(projectId, userId);
    if (!this.collaboratorManagerRoles.has(membership.role_name)) {
      throw new ForbiddenException('Requires admin role');
    }
    return membership;
  }

  async assertProjectOwner(projectId: number, userId: number) {
    const membership = await this.getProjectMembership(projectId, userId);
    if (membership.owner_user_id !== userId) {
      throw new ForbiddenException('Requires owner role');
    }
    return membership;
  }

  async getCardProjectId(cardId: number): Promise<number> {
    const row = await this.cardsRepo
      .createQueryBuilder('c')
      .innerJoin('c.column', 'col')
      .where('c.card_id = :cardId', { cardId })
      .select('col.project_id', 'project_id')
      .getRawOne<{ project_id: number }>();
    if (!row) throw new NotFoundException('Card not found');
    return row.project_id;
  }

  async getColumnProjectId(columnId: number): Promise<number> {
    const col = await this.columnsRepo.findOne({
      where: { column_id: columnId },
      select: { project_id: true },
    });
    if (!col) throw new NotFoundException('Column not found');
    return col.project_id;
  }

  isPrivilegedRole(roleName: string): boolean {
    return this.privilegedRoles.has(roleName as ProjectRole);
  }
}
