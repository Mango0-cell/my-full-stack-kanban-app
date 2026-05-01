import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationRoleDto } from './dto/update-invitation-role.dto';

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

  @Delete(':id')
  async cancel(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    await this.invitationsService.cancelInvitation(id, user.userId);
    return { data: null, message: 'Invitation cancelled', error: null };
  }

  @Put(':id')
  async updateRole(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateInvitationRoleDto,
  ) {
    const invitation = await this.invitationsService.updateInvitationRole(id, user.userId, body.role_name);
    return { data: invitation, message: 'Invitation role updated', error: null };
  }

  @Post(':id/decline')
  async decline(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    await this.invitationsService.declineInvitation(id, user.userId);
    return { data: null, message: 'Invitation declined', error: null };
  }

  @Post('accept-by-token')
  async acceptByToken(@Body('token') token: string, @CurrentUser() user: JwtPayload) {
    if (!token) throw new BadRequestException('Token is required');
    const invitation = await this.invitationsService.acceptByToken(token, user.userId);
    return { data: invitation, message: 'Invitation accepted', error: null };
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
