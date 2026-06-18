import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  Invitation,
  Project,
  ProjectMember,
  Role,
  User,
} from '../entities';
import { ProjectAccessService } from '../projects/project-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationsRepo: Repository<Invitation>,
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => ProjectAccessService))
    private readonly projectAccess: ProjectAccessService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => RealtimeEventsService))
    private readonly realtimeEvents: RealtimeEventsService,
    private readonly mailService: MailService,
  ) {}

  async createInvitation(
    inviterUserId: number,
    dto: { project_id: number; email: string; role_name: string; message?: string },
  ) {
    const projectId = dto.project_id;
    const inviteeEmail = dto.email.trim().toLowerCase();
    if (!inviteeEmail.endsWith('@gmail.com')) {
      throw new BadRequestException('Only Gmail addresses are allowed for invitations');
    }

    await this.projectAccess.assertOwnerOrAdmin(projectId, inviterUserId);

    const project = await this.projectsRepo.findOne({
      where: { project_id: projectId },
      select: { project_name: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const normalizedRoleName = dto.role_name.trim().toLowerCase();
    const role = await this.rolesRepo.findOne({ where: { role_name: normalizedRoleName } });
    if (!role) throw new BadRequestException('Invalid role_name');

    const invitee = await this.usersRepo.findOne({
      where: { email: inviteeEmail },
      select: { user_id: true, email: true },
    });
    const inviteeUserId: number | null = invitee?.user_id ?? null;

    if (inviteeUserId) {
      const alreadyMember = await this.membersRepo.count({
        where: { project_id: projectId, user_id: inviteeUserId },
      });
      if (alreadyMember > 0) {
        throw new ConflictException('User is already a project member');
      }
    }

    const pendingExists = await this.invitationsRepo
      .createQueryBuilder('i')
      .where('i.project_id = :projectId', { projectId })
      .andWhere('i.status = :pending', { pending: 'pending' })
      .andWhere('LOWER(i.invitee_email) = LOWER(:email)', { email: inviteeEmail })
      .getCount();
    if (pendingExists > 0) {
      throw new ConflictException('A pending invitation already exists for this email');
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const landingUrl = 'https://kanban-app-full-stack.vercel.app';

    const entity = this.invitationsRepo.create({
      project_id: projectId,
      inviter_user_id: inviterUserId,
      invitee_user_id: inviteeUserId,
      invitee_email: inviteeEmail,
      role_id: role.role_id,
      message: dto.message ?? null,
      token,
      status: 'pending',
      expires_at: expiresAt,
    });
    const invitation = await this.invitationsRepo.save(entity);

    if (inviteeUserId) {
      await this.notificationsService.createNotification({
        userId: inviteeUserId,
        type: 'invitation_received',
        title: 'Project invitation',
        body: `You were invited to ${project.project_name}`,
        entityType: 'invitation',
        entityId: invitation.invitation_id,
        metadata: { project_id: projectId },
      });
      this.realtimeEvents.emitToUser(inviteeUserId, 'invitation.received', invitation);
    }

    const inviter = await this.usersRepo.findOne({
      where: { user_id: inviterUserId },
      select: { display_name: true, email: true },
    });
    const inviterName = inviter?.display_name || inviter?.email || 'A teammate';

    if (!inviteeUserId) {
      try {
        await this.mailService.sendInvite({
          to: inviteeEmail,
          inviterName,
          message: dto.message,
          frontendUrl: landingUrl,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown email provider error';
        this.logger.error(`Invitation email failed for ${inviteeEmail}: ${errorMessage}`);
      }
    }

    return invitation;
  }

  async listReceivedInvitations(userId: number) {
    const user = await this.usersRepo.findOne({
      where: { user_id: userId },
      select: { email: true },
    });
    const userEmail = user?.email.toLowerCase() ?? '';

    return this.invitationsRepo
      .createQueryBuilder('i')
      .innerJoin('i.project', 'p')
      .innerJoin('i.inviter', 'u')
      .innerJoin('i.role', 'r')
      .where(
        'i.invitee_user_id = :userId OR (i.invitee_user_id IS NULL AND LOWER(i.invitee_email) = :userEmail)',
        { userId, userEmail },
      )
      .orderBy('i.created_at', 'DESC')
      .select([
        'i.invitation_id AS invitation_id',
        'i.project_id AS project_id',
        'i.inviter_user_id AS inviter_user_id',
        'i.invitee_user_id AS invitee_user_id',
        'i.invitee_email AS invitee_email',
        'i.role_id AS role_id',
        'i.message AS message',
        'i.token AS token',
        'i.status AS status',
        'i.expires_at AS expires_at',
        'i.accepted_at AS accepted_at',
        'i.created_at AS created_at',
        'i.updated_at AS updated_at',
        'p.project_name AS project_name',
        'u.display_name AS inviter_display_name',
        'r.role_name AS role_name',
      ])
      .getRawMany();
  }

  async listSentInvitations(userId: number) {
    return this.invitationsRepo
      .createQueryBuilder('i')
      .innerJoin('i.project', 'p')
      .innerJoin('i.role', 'r')
      .where('i.inviter_user_id = :userId', { userId })
      .orderBy('i.created_at', 'DESC')
      .select([
        'i.invitation_id AS invitation_id',
        'i.project_id AS project_id',
        'i.inviter_user_id AS inviter_user_id',
        'i.invitee_user_id AS invitee_user_id',
        'i.invitee_email AS invitee_email',
        'i.role_id AS role_id',
        'i.message AS message',
        'i.token AS token',
        'i.status AS status',
        'i.expires_at AS expires_at',
        'i.accepted_at AS accepted_at',
        'i.created_at AS created_at',
        'i.updated_at AS updated_at',
        'p.project_name AS project_name',
        'r.role_name AS role_name',
      ])
      .getRawMany();
  }

  async listPendingInvitations(userId: number) {
    const user = await this.usersRepo.findOne({
      where: { user_id: userId },
      select: { email: true },
    });
    const userEmail = user?.email.toLowerCase() ?? '';

    return this.invitationsRepo
      .createQueryBuilder('i')
      .innerJoin('i.project', 'p')
      .innerJoin('i.inviter', 'u')
      .innerJoin('i.role', 'r')
      .where('i.status = :pending', { pending: 'pending' })
      .andWhere(
        '(i.inviter_user_id = :userId OR i.invitee_user_id = :userId OR (i.invitee_user_id IS NULL AND LOWER(i.invitee_email) = :userEmail))',
        { userId, userEmail },
      )
      .orderBy('i.created_at', 'DESC')
      .select([
        'i.invitation_id AS invitation_id',
        'i.project_id AS project_id',
        'i.inviter_user_id AS inviter_user_id',
        'i.invitee_user_id AS invitee_user_id',
        'i.invitee_email AS invitee_email',
        'i.role_id AS role_id',
        'i.message AS message',
        'i.token AS token',
        'i.status AS status',
        'i.expires_at AS expires_at',
        'i.accepted_at AS accepted_at',
        'i.created_at AS created_at',
        'i.updated_at AS updated_at',
        'p.project_name AS project_name',
        'u.display_name AS inviter_display_name',
        'r.role_name AS role_name',
        "CASE WHEN i.inviter_user_id = :userId THEN 'sent' ELSE 'received' END AS direction",
      ])
      .getRawMany();
  }

  async cancelInvitation(invitationId: number, userId: number) {
    const inv = await this.invitationsRepo.findOne({
      where: { invitation_id: invitationId },
    });
    if (!inv) throw new NotFoundException('Invitation not found');
    if (inv.status !== 'pending') throw new BadRequestException('Invitation is not pending');

    const isInviter = inv.inviter_user_id === userId;
    if (!isInviter) {
      await this.projectAccess.assertOwnerOrAdmin(inv.project_id, userId);
    }

    await this.invitationsRepo.update(
      { invitation_id: invitationId },
      { status: 'declined' },
    );

    if (inv.invitee_user_id) {
      this.realtimeEvents.emitToUser(inv.invitee_user_id, 'invitation.updated', {
        invitation_id: invitationId,
        status: 'declined',
      });
    }
  }

  async updateInvitationRole(invitationId: number, userId: number, roleName: string) {
    const inv = await this.invitationsRepo.findOne({
      where: { invitation_id: invitationId },
    });
    if (!inv) throw new NotFoundException('Invitation not found');
    if (inv.status !== 'pending') throw new BadRequestException('Invitation is not pending');

    await this.projectAccess.assertOwnerOrAdmin(inv.project_id, userId);

    const normalizedRole = roleName.trim().toLowerCase();
    const role = await this.rolesRepo.findOne({ where: { role_name: normalizedRole } });
    if (!role) throw new BadRequestException('Invalid role');

    await this.invitationsRepo.update(
      { invitation_id: invitationId },
      { role_id: role.role_id },
    );
    return this.invitationsRepo.findOne({ where: { invitation_id: invitationId } });
  }

  async declineInvitation(invitationId: number, userId: number) {
    const inv = await this.invitationsRepo.findOne({
      where: { invitation_id: invitationId, status: 'pending' },
    });
    if (!inv) throw new NotFoundException('Invitation not found or already processed');

    const user = await this.usersRepo.findOne({
      where: { user_id: userId },
      select: { email: true },
    });
    const userEmail = user?.email;

    const isInvitee =
      inv.invitee_user_id === userId ||
      (inv.invitee_user_id === null &&
        inv.invitee_email.toLowerCase() === userEmail?.toLowerCase());

    if (!isInvitee) throw new BadRequestException('You are not the invitee');

    await this.invitationsRepo.update(
      { invitation_id: invitationId },
      { status: 'declined' },
    );

    await this.notificationsService.createNotification({
      userId: inv.inviter_user_id,
      type: 'invitation_declined',
      title: 'Invitation declined',
      body: `${userEmail} declined your invitation`,
      entityType: 'invitation',
      entityId: invitationId,
      metadata: { project_id: inv.project_id },
    });

    this.realtimeEvents.emitToUser(inv.inviter_user_id, 'invitation.updated', {
      invitation_id: invitationId,
      status: 'declined',
    });
  }

  async acceptByToken(token: string, userId: number) {
    const inv = await this.invitationsRepo.findOne({
      where: { token, status: 'pending' },
      select: { invitation_id: true },
    });
    if (!inv) throw new NotFoundException('Invitation not found or already processed');
    return this.acceptInvitation(inv.invitation_id, userId);
  }

  async acceptInvitation(invitationId: number, userId: number) {
    const updatedInvitation = await this.dataSource.transaction(async (manager) => {
      // SELECT … FOR UPDATE on the invitation row
      const invitation = await manager
        .createQueryBuilder(Invitation, 'i')
        .where('i.invitation_id = :id', { id: invitationId })
        .setLock('pessimistic_write')
        .getOne();

      if (!invitation) throw new NotFoundException('Invitation not found');
      if (invitation.status !== 'pending') {
        throw new BadRequestException('Invitation is no longer pending');
      }

      if (new Date(invitation.expires_at).getTime() < Date.now()) {
        await manager.update(
          Invitation,
          { invitation_id: invitationId },
          { status: 'expired' },
        );
        throw new BadRequestException('Invitation has expired');
      }

      const user = await manager.findOne(User, {
        where: { user_id: userId },
        select: { email: true },
      });
      if (!user) throw new NotFoundException('User not found');

      const currentUserEmail = user.email;
      if (
        invitation.invitee_user_id !== null &&
        invitation.invitee_user_id !== userId
      ) {
        throw new BadRequestException('Invitation is assigned to another user');
      }
      if (
        invitation.invitee_user_id === null &&
        invitation.invitee_email.toLowerCase() !==
          String(currentUserEmail).toLowerCase()
      ) {
        throw new BadRequestException('Invitation email does not match current account');
      }

      // ON CONFLICT DO NOTHING via raw SQL since we need composite-unique semantics.
      await manager.query(
        `INSERT INTO project_members (project_id, user_id, role_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [invitation.project_id, userId, invitation.role_id],
      );

      await manager.update(
        Invitation,
        { invitation_id: invitationId },
        {
          status: 'accepted',
          invitee_user_id: userId,
          accepted_at: new Date(),
        },
      );

      const refreshed = await manager.findOne(Invitation, {
        where: { invitation_id: invitationId },
      });
      if (!refreshed) throw new NotFoundException('Invitation missing after accept');
      return refreshed;
    });

    const acceptingUser = await this.usersRepo.findOne({
      where: { user_id: userId },
      select: { email: true },
    });
    const acceptingEmail = acceptingUser?.email ?? '';

    await this.notificationsService.createNotification({
      userId: updatedInvitation.inviter_user_id,
      type: 'invitation_accepted',
      title: 'Invitation accepted',
      body: `${acceptingEmail} accepted your invitation`,
      entityType: 'invitation',
      entityId: updatedInvitation.invitation_id,
      metadata: { project_id: updatedInvitation.project_id, user_id: userId },
    });

    this.realtimeEvents.emitToUser(
      updatedInvitation.inviter_user_id,
      'invitation.accepted',
      updatedInvitation,
    );
    this.realtimeEvents.emitToUser(userId, 'invitation.updated', updatedInvitation);

    return updatedInvitation;
  }

  // Helper kept exported for potential future use
  async findRoleIds(roleNames: string[]) {
    return this.rolesRepo.find({ where: { role_name: In(roleNames) } });
  }
}
