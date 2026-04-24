import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
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

    const projectResult = await this.db.query(
      'SELECT project_name FROM projects WHERE project_id = $1',
      [projectId],
    );

    if (projectResult.rows.length === 0) {
      throw new NotFoundException('Project not found');
    }

    const normalizedRoleName = dto.role_name.trim().toLowerCase();
    const roleResult = await this.db.query(
      'SELECT role_id, role_name FROM roles WHERE role_name = $1',
      [normalizedRoleName],
    );

    if (roleResult.rows.length === 0) {
      throw new BadRequestException('Invalid role_name');
    }

    const inviteeResult = await this.db.query(
      'SELECT user_id, email FROM users WHERE email = $1',
      [inviteeEmail],
    );

    const inviteeUserId: number | null = inviteeResult.rows[0]?.user_id ?? null;

    if (inviteeUserId) {
      const memberResult = await this.db.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, inviteeUserId],
      );
      if (memberResult.rows.length > 0) {
        throw new ConflictException('User is already a project member');
      }
    }

    const pendingInvitationResult = await this.db.query(
      `SELECT invitation_id
       FROM invitations
       WHERE project_id = $1
         AND status = 'pending'
         AND LOWER(invitee_email) = LOWER($2)
       LIMIT 1`,
      [projectId, inviteeEmail],
    );

    if (pendingInvitationResult.rows.length > 0) {
      throw new ConflictException('A pending invitation already exists for this email');
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const landingUrl = this.config.get<string>(
      'INVITATION_LANDING_URL',
      'https://kanban-app-full-stack.vercel.app',
    );
    const acceptUrl = `${landingUrl}/invitations/accept?token=${encodeURIComponent(token)}`;

    const { rows } = await this.db.query(
      `INSERT INTO invitations (
        project_id,
        inviter_user_id,
        invitee_user_id,
        invitee_email,
        role_id,
        message,
        token,
        status,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
      RETURNING *`,
      [
        projectId,
        inviterUserId,
        inviteeUserId,
        inviteeEmail,
        roleResult.rows[0].role_id,
        dto.message || null,
        token,
        expiresAt,
      ],
    );

    const invitation = rows[0];

    if (inviteeUserId) {
      await this.notificationsService.createNotification({
        userId: inviteeUserId,
        type: 'invitation_received',
        title: 'Project invitation',
        body: `You were invited to ${projectResult.rows[0].project_name}`,
        entityType: 'invitation',
        entityId: invitation.invitation_id,
        metadata: { project_id: projectId },
      });

      this.realtimeEvents.emitToUser(inviteeUserId, 'invitation.received', invitation);
    }

    const inviterResult = await this.db.query(
      'SELECT display_name, email FROM users WHERE user_id = $1',
      [inviterUserId],
    );

    const inviterName = inviterResult.rows[0]?.display_name || inviterResult.rows[0]?.email || 'A teammate';

    try {
      await this.mailService.sendInvite({
        to: inviteeEmail,
        inviterName,
        message: dto.message,
        acceptUrl,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown email provider error';
      this.logger.error(`Invitation email failed for ${inviteeEmail}: ${errorMessage}`);
    }

    return invitation;
  }

  async listReceivedInvitations(userId: number) {
    const { rows } = await this.db.query(
      `WITH current_user AS (
         SELECT LOWER(email) AS email
         FROM users
         WHERE user_id = $1
       )
       SELECT i.*, p.project_name, u.display_name AS inviter_display_name, r.role_name
       FROM invitations i
       JOIN projects p ON p.project_id = i.project_id
       JOIN users u ON u.user_id = i.inviter_user_id
       JOIN roles r ON r.role_id = i.role_id
       WHERE i.invitee_user_id = $1
          OR (
            i.invitee_user_id IS NULL
            AND LOWER(i.invitee_email) = (SELECT email FROM current_user)
          )
       ORDER BY i.created_at DESC`,
      [userId],
    );

    return rows;
  }

  async listSentInvitations(userId: number) {
    const { rows } = await this.db.query(
      `SELECT i.*, p.project_name, r.role_name
       FROM invitations i
       JOIN projects p ON p.project_id = i.project_id
       JOIN roles r ON r.role_id = i.role_id
       WHERE i.inviter_user_id = $1
       ORDER BY i.created_at DESC`,
      [userId],
    );

    return rows;
  }

  async listPendingInvitations(userId: number) {
    const { rows } = await this.db.query(
      `WITH current_user AS (
         SELECT LOWER(email) AS email
         FROM users
         WHERE user_id = $1
       )
       SELECT
         i.*,
         p.project_name,
         u.display_name AS inviter_display_name,
         r.role_name,
         CASE
           WHEN i.inviter_user_id = $1 THEN 'sent'
           ELSE 'received'
         END AS direction
       FROM invitations i
       JOIN projects p ON p.project_id = i.project_id
       JOIN users u ON u.user_id = i.inviter_user_id
       JOIN roles r ON r.role_id = i.role_id
       WHERE i.status = 'pending'
         AND (
           i.inviter_user_id = $1
           OR i.invitee_user_id = $1
           OR (
             i.invitee_user_id IS NULL
             AND LOWER(i.invitee_email) = (SELECT email FROM current_user)
           )
         )
       ORDER BY i.created_at DESC`,
      [userId],
    );

    return rows;
  }

  async acceptByToken(token: string, userId: number) {
    const { rows } = await this.db.query(
      `SELECT invitation_id FROM invitations WHERE token = $1 AND status = 'pending'`,
      [token],
    );
    if (!rows[0]) throw new NotFoundException('Invitation not found or already processed');
    return this.acceptInvitation(rows[0].invitation_id, userId);
  }

  async acceptInvitation(invitationId: number, userId: number) {
    const client = await this.db.getClient();

    try {
      await client.query('BEGIN');

      const invitationResult = await client.query(
        `SELECT i.*, u.email AS invitee_email_actual
         FROM invitations i
         LEFT JOIN users u ON u.user_id = i.invitee_user_id
         WHERE i.invitation_id = $1
         FOR UPDATE`,
        [invitationId],
      );

      if (invitationResult.rows.length === 0) {
        throw new NotFoundException('Invitation not found');
      }

      const invitation = invitationResult.rows[0];
      if (invitation.status !== 'pending') {
        throw new BadRequestException('Invitation is no longer pending');
      }

      if (new Date(invitation.expires_at).getTime() < Date.now()) {
        await client.query(
          `UPDATE invitations
           SET status = 'expired', updated_at = NOW()
           WHERE invitation_id = $1`,
          [invitationId],
        );
        throw new BadRequestException('Invitation has expired');
      }

      const userResult = await client.query(
        'SELECT email FROM users WHERE user_id = $1',
        [userId],
      );

      if (userResult.rows.length === 0) {
        throw new NotFoundException('User not found');
      }

      const currentUserEmail = userResult.rows[0].email;
      if (
        invitation.invitee_user_id !== null &&
        invitation.invitee_user_id !== userId
      ) {
        throw new BadRequestException('Invitation is assigned to another user');
      }

      if (
        invitation.invitee_user_id === null &&
        invitation.invitee_email.toLowerCase() !== String(currentUserEmail).toLowerCase()
      ) {
        throw new BadRequestException('Invitation email does not match current account');
      }

      await client.query(
        `INSERT INTO project_members (project_id, user_id, role_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [invitation.project_id, userId, invitation.role_id],
      );

      const { rows: updatedRows } = await client.query(
        `UPDATE invitations
         SET status = 'accepted',
             invitee_user_id = $1,
             accepted_at = NOW(),
             updated_at = NOW()
         WHERE invitation_id = $2
         RETURNING *`,
        [userId, invitationId],
      );

      await client.query('COMMIT');

      const updatedInvitation = updatedRows[0];

      await this.notificationsService.createNotification({
        userId: invitation.inviter_user_id,
        type: 'invitation_accepted',
        title: 'Invitation accepted',
        body: `${currentUserEmail} accepted your invitation`,
        entityType: 'invitation',
        entityId: updatedInvitation.invitation_id,
        metadata: { project_id: invitation.project_id, user_id: userId },
      });

      this.realtimeEvents.emitToUser(invitation.inviter_user_id, 'invitation.accepted', updatedInvitation);
      this.realtimeEvents.emitToUser(userId, 'invitation.updated', updatedInvitation);

      return updatedInvitation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
