import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInvitationDto,
  ) {
    const invitation = await this.invitationsService.createInvitation(user.userId, dto);
    return { data: invitation, message: 'Invitation sent', error: null };
  }

  @Get()
  async listReceived(@CurrentUser() user: JwtPayload) {
    const invitations = await this.invitationsService.listReceivedInvitations(user.userId);
    return { data: invitations, message: 'OK', error: null };
  }

  @Get('sent')
  async listSent(@CurrentUser() user: JwtPayload) {
    const invitations = await this.invitationsService.listSentInvitations(user.userId);
    return { data: invitations, message: 'OK', error: null };
  }

  @Get('pending')
  async listPending(@CurrentUser() user: JwtPayload) {
    const invitations = await this.invitationsService.listPendingInvitations(user.userId);
    return { data: invitations, message: 'OK', error: null };
  }

  @Post(':id/accept')
  async accept(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const invitation = await this.invitationsService.acceptInvitation(id, user.userId);
    return { data: invitation, message: 'Invitation accepted', error: null };
  }
}
