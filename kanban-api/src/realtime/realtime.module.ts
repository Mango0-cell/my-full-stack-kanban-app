import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectConversation, ProjectMember } from '../entities';
import { ProjectsModule } from '../projects/projects.module';
import { RealtimeAuthService } from './realtime-auth.service';
import { RealtimeEventsService } from './realtime-events.service';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectMember, DirectConversation]),
    forwardRef(() => ProjectsModule),
  ],
  providers: [RealtimeAuthService, RealtimeEventsService, RealtimeGateway],
  exports: [RealtimeEventsService],
})
export class RealtimeModule {}
