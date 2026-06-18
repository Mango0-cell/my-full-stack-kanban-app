import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardColumn, Card, Project, ProjectMember, Role, User } from '../entities';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectAccessService } from './project-access.service';
import { InvitationsModule } from '../invitations/invitations.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, Role, User, BoardColumn, Card]),
    forwardRef(() => InvitationsModule),
    forwardRef(() => RealtimeModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectAccessService],
  exports: [ProjectsService, ProjectAccessService],
})
export class ProjectsModule {}
