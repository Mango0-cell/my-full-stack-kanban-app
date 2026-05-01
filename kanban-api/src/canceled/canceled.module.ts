import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RolePolicyModule } from '../common/policies/role-policy.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CanceledController } from './canceled.controller';
import { CanceledService } from './canceled.service';

@Module({
  imports: [DatabaseModule, RolePolicyModule, RealtimeModule],
  controllers: [CanceledController],
  providers: [CanceledService],
})
export class CanceledModule {}
