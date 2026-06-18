import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BoardColumn,
  CanceledCard,
  CanceledColumnGroup,
  Card,
  CardActivity,
} from '../entities';
import { RolePolicyModule } from '../common/policies/role-policy.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CanceledController } from './canceled.controller';
import { CanceledService } from './canceled.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CanceledCard,
      CanceledColumnGroup,
      Card,
      CardActivity,
      BoardColumn,
    ]),
    RolePolicyModule,
    RealtimeModule,
  ],
  controllers: [CanceledController],
  providers: [CanceledService],
})
export class CanceledModule {}
