import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/add-member.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { InvitationsService } from '../invitations/invitations.service';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    const projects = await this.projectsService.listProjects(user.userId);
    return { data: projects, message: 'OK', error: null };
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProjectDto) {
    const project = await this.projectsService.createProject(user.userId, dto.project_name, dto.description);
    return { data: project, message: 'Project created', error: null };
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    const project = await this.projectsService.getProject(id, user.userId);
    return { data: project, message: 'OK', error: null };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProjectDto,
  ) {
    const project = await this.projectsService.updateProject(id, user.userId, dto);
    return { data: project, message: 'Project updated', error: null };
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    await this.projectsService.deleteProject(id, user.userId);
    return { data: null, message: 'Project deleted', error: null };
  }

  @Get(':id/members')
  async listMembers(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    const members = await this.projectsService.listMembers(id, user.userId);
    return { data: members, message: 'OK', error: null };
  }

  @Post(':id/members')
  async addMember(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddMemberDto,
  ) {
    const invitation = await this.invitationsService.createInvitation(user.userId, {
      project_id: id,
      email: dto.user_email,
      role_name: dto.role_name,
      message: dto.message,
    });
    return { data: invitation, message: 'Invitation sent', error: null };
  }

  @Put(':id/members/:uid')
  async updateMemberRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('uid', ParseIntPipe) uid: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const member = await this.projectsService.updateMemberRole(id, user.userId, uid, dto.role_name);
    return { data: member, message: 'Role updated', error: null };
  }

  @Delete(':id/members/:uid')
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('uid', ParseIntPipe) uid: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.projectsService.removeMember(id, user.userId, uid);
    return { data: null, message: 'Member removed', error: null };
  }
}
