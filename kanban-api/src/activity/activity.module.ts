import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardActivity } from '../entities';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [TypeOrmModule.forFeature([CardActivity])],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}
