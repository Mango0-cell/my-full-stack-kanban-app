import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { RealtimeAuthService } from './realtime-auth.service';
import { RealtimeEventsService } from './realtime-events.service';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [DatabaseModule, forwardRef(() => ProjectsModule)],
  providers: [RealtimeAuthService, RealtimeEventsService, RealtimeGateway],
  exports: [RealtimeEventsService],
})
export class RealtimeModule {}
