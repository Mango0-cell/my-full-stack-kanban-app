import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card, CardActivity } from '../entities';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, CardActivity]),
    RealtimeModule,
    forwardRef(() => ProjectsModule),
  ],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
