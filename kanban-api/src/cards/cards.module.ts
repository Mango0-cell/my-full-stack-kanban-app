import { forwardRef, Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [RealtimeModule, forwardRef(() => ProjectsModule)],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
