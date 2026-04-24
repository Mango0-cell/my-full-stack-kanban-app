import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectAccessService } from './project-access.service';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => InvitationsModule)],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectAccessService],
  exports: [ProjectsService, ProjectAccessService],
})
export class ProjectsModule {}
