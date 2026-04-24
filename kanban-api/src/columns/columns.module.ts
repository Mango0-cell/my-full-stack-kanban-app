import { forwardRef, Module } from '@nestjs/common';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [RealtimeModule, forwardRef(() => ProjectsModule)],
  controllers: [ColumnsController],
  providers: [ColumnsService],
  exports: [ColumnsService],
})
export class ColumnsModule {}
