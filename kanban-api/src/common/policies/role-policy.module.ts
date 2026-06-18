import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardColumn, Card, ProjectMember } from '../../entities';
import { RolePolicyService } from './role-policy.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ProjectMember, BoardColumn, Card])],
  providers: [RolePolicyService],
  exports: [RolePolicyService],
})
export class RolePolicyModule {}
