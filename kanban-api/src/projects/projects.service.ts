import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Project, ProjectMember, Role, User } from '../entities';
import { RolePolicyService } from '../common/policies/role-policy.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly rolePolicy: RolePolicyService,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {}

  private async getRoleByName(roleName: string) {
    const normalizedRole = roleName.trim().toLowerCase();
    const candidates =
      normalizedRole === 'editor'
        ? ['editor', 'member']
        : normalizedRole === 'member'
          ? ['member', 'editor']
          : [normalizedRole];

    const roles = await this.rolesRepo.find({
      where: { role_name: In(candidates) },
    });
    if (roles.length === 0) throw new BadRequestException('Invalid role name');
    // Prefer exact match
    const exact = roles.find((r) => r.role_name === normalizedRole);
    const picked = exact ?? roles[0];
    return { role_id: picked.role_id, role_name: picked.role_name };
  }

  private async getMemberRole(projectId: number, targetUserId: number) {
    const row = await this.membersRepo
      .createQueryBuilder('pm')
      .innerJoin('pm.role', 'r')
      .where('pm.project_id = :projectId AND pm.user_id = :targetUserId', {
        projectId,
        targetUserId,
      })
      .select(['pm.user_id AS user_id', 'r.role_name AS role_name'])
      .getRawOne<{ user_id: number; role_name: string }>();
    if (!row) throw new NotFoundException('Member not found');
    return row;
  }

  async listProjects(userId: number) {
    return this.projectsRepo
      .createQueryBuilder('p')
      .innerJoin('p.members', 'pm')
      .innerJoin('pm.role', 'r')
      .where('pm.user_id = :userId', { userId })
      .orderBy('p.created_at', 'DESC')
      .select([
        'p.project_id AS project_id',
        'p.project_name AS project_name',
        'p.description AS description',
        'p.owner_user_id AS owner_user_id',
        'p.created_at AS created_at',
        'p.updated_at AS updated_at',
        'r.role_name AS member_role',
      ])
      .getRawMany();
  }

  async createProject(userId: number, projectName: string, description?: string) {
    return this.dataSource.transaction(async (manager) => {
      const project = manager.create(Project, {
        owner_user_id: userId,
        project_name: projectName,
        description: description ?? null,
      });
      const savedProject = await manager.save(project);

      const ownerRole = await manager.findOne(Role, { where: { role_name: 'owner' } });
      if (!ownerRole) throw new Error('Owner role missing from roles table');

      const member = manager.create(ProjectMember, {
        project_id: savedProject.project_id,
        user_id: userId,
        role_id: ownerRole.role_id,
      });
      await manager.save(member);
      return savedProject;
    });
  }

  async getProject(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    const project = await this.projectsRepo.findOne({ where: { project_id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(
    projectId: number,
    userId: number,
    updates: { project_name?: string; description?: string },
  ) {
    await this.rolePolicy.assertProjectCollaboratorManage(projectId, userId);
    const patch: Partial<Project> = {};
    if (updates.project_name) patch.project_name = updates.project_name;
    if ('description' in updates) patch.description = updates.description ?? null;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    await this.projectsRepo.update(
      { project_id: projectId },
      patch as QueryDeepPartialEntity<Project>,
    );
    return this.projectsRepo.findOne({ where: { project_id: projectId } });
  }

  async deleteProject(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectOwner(projectId, userId);
    const result = await this.projectsRepo.delete({ project_id: projectId });
    if (!result.affected) throw new NotFoundException('Project not found');
  }

  async listMembers(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectReadable(projectId, userId);

    // Joined members
    const joined = await this.membersRepo
      .createQueryBuilder('pm')
      .innerJoin('pm.user', 'u')
      .innerJoin('pm.role', 'r')
      .where('pm.project_id = :projectId', { projectId })
      .select([
        'u.user_id AS user_id',
        'u.email AS email',
        'u.display_name AS display_name',
        'u.avatar_url AS avatar_url',
        'r.role_name AS role_name',
        'pm.joined_at AS joined_at',
      ])
      .getRawMany<{
        user_id: number;
        email: string;
        display_name: string;
        avatar_url: string | null;
        role_name: string;
        joined_at: Date;
      }>();

    const joinedRows = joined.map((r) => ({
      ...r,
      membership_status: 'joined' as const,
      invitation_id: null as number | null,
      invitation_status: null as string | null,
    }));

    // Pending invitations not already represented as members
    const joinedUserIds = new Set(joinedRows.map((r) => r.user_id));
    const joinedEmails = new Set(joinedRows.map((r) => r.email.toLowerCase()));

    const pending = await this.dataSource
      .createQueryBuilder()
      .from('invitations', 'i')
      .leftJoin(
        'users',
        'u',
        '(u.user_id = i.invitee_user_id) OR (i.invitee_user_id IS NULL AND LOWER(u.email) = LOWER(i.invitee_email))',
      )
      .innerJoin('roles', 'r', 'r.role_id = i.role_id')
      .where('i.project_id = :projectId AND i.status = :pending', {
        projectId,
        pending: 'pending',
      })
      .orderBy('i.created_at', 'ASC')
      .select([
        'COALESCE(u.user_id, -i.invitation_id) AS user_id',
        'i.invitee_email AS email',
        "COALESCE(u.display_name, SPLIT_PART(i.invitee_email, '@', 1)) AS display_name",
        'u.avatar_url AS avatar_url',
        'r.role_name AS role_name',
        'i.created_at AS joined_at',
        'i.invitation_id AS invitation_id',
        'i.status AS invitation_status',
        'i.invitee_user_id AS invitee_user_id',
      ])
      .getRawMany<{
        user_id: number;
        email: string;
        display_name: string;
        avatar_url: string | null;
        role_name: string;
        joined_at: Date;
        invitation_id: number;
        invitation_status: string;
        invitee_user_id: number | null;
      }>();

    const pendingRows = pending
      .filter((p) => {
        // Exclude pending invitations for users already joined
        if (p.invitee_user_id && joinedUserIds.has(p.invitee_user_id)) return false;
        if (!p.invitee_user_id && joinedEmails.has(p.email.toLowerCase())) return false;
        return true;
      })
      .map(({ invitee_user_id, ...rest }) => {
        void invitee_user_id;
        return {
          ...rest,
          membership_status: 'pending' as const,
        };
      });

    return [...joinedRows, ...pendingRows].sort(
      (a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime(),
    );
  }

  async addMember(
    projectId: number,
    requesterId: number,
    userEmail: string,
    roleName: string,
  ) {
    const requester = await this.rolePolicy.assertProjectCollaboratorManage(
      projectId,
      requesterId,
    );
    const requesterIsProjectAuthor = requester.owner_user_id === requesterId;

    const user = await this.usersRepo.findOne({
      where: { email: userEmail },
      select: { user_id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.getRoleByName(roleName);

    if (!requesterIsProjectAuthor && this.rolePolicy.isPrivilegedRole(role.role_name)) {
      throw new ForbiddenException('Only project owner can assign privileged roles');
    }

    try {
      const entity = this.membersRepo.create({
        project_id: projectId,
        user_id: user.user_id,
        role_id: role.role_id,
      });
      return await this.membersRepo.save(entity);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('User is already a member');
      }
      throw err;
    }
  }

  async updateMemberRole(
    projectId: number,
    requesterId: number,
    targetUserId: number,
    roleName: string,
  ) {
    const requester = await this.rolePolicy.assertProjectCollaboratorManage(
      projectId,
      requesterId,
    );
    const requesterIsProjectAuthor = requester.owner_user_id === requesterId;
    const targetMember = await this.getMemberRole(projectId, targetUserId);
    const role = await this.getRoleByName(roleName);

    if (targetUserId === requesterId) {
      throw new ForbiddenException('Cannot change your own role');
    }
    if (!requesterIsProjectAuthor) {
      if (this.rolePolicy.isPrivilegedRole(targetMember.role_name)) {
        throw new ForbiddenException('Only project owner can change privileged roles');
      }
      if (this.rolePolicy.isPrivilegedRole(role.role_name)) {
        throw new ForbiddenException('Only project owner can assign privileged roles');
      }
    }

    const result = await this.membersRepo.update(
      { project_id: projectId, user_id: targetUserId },
      { role_id: role.role_id },
    );
    if (!result.affected) throw new NotFoundException('Member not found');

    const updated = await this.membersRepo.findOne({
      where: { project_id: projectId, user_id: targetUserId },
    });

    this.realtimeEvents.emitToProject(projectId, 'member.role.changed', {
      project_id: projectId,
      user_id: targetUserId,
      new_role: role.role_name,
    });
    this.realtimeEvents.emitToUser(targetUserId, 'member.role.changed', {
      project_id: projectId,
      user_id: targetUserId,
      new_role: role.role_name,
    });
    return updated;
  }

  async leaveProject(projectId: number, userId: number) {
    const project = await this.projectsRepo.findOne({
      where: { project_id: projectId },
      select: { owner_user_id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.owner_user_id === userId) {
      throw new ForbiddenException('Project owner cannot leave their own project');
    }

    const result = await this.membersRepo.delete({ project_id: projectId, user_id: userId });
    if (!result.affected) throw new NotFoundException('Not a member of this project');

    this.realtimeEvents.emitToProject(projectId, 'member.left', {
      project_id: projectId,
      user_id: userId,
    });
  }

  async removeMember(projectId: number, requesterId: number, targetUserId: number) {
    const requester = await this.rolePolicy.assertProjectCollaboratorManage(
      projectId,
      requesterId,
    );
    const requesterIsProjectAuthor = requester.owner_user_id === requesterId;
    const targetMember = await this.getMemberRole(projectId, targetUserId);

    if (targetUserId === requester.owner_user_id) {
      throw new ForbiddenException('Cannot remove the project owner');
    }

    if (
      !requesterIsProjectAuthor &&
      this.rolePolicy.isPrivilegedRole(targetMember.role_name)
    ) {
      throw new ForbiddenException('Only project owner can remove privileged roles');
    }

    const result = await this.membersRepo.delete({
      project_id: projectId,
      user_id: targetUserId,
    });
    if (!result.affected) throw new NotFoundException('Member not found');

    this.realtimeEvents.emitToProject(projectId, 'member.removed', {
      project_id: projectId,
      user_id: targetUserId,
    });
  }
}
