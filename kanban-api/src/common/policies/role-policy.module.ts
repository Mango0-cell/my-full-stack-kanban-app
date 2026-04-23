import { Global, Module } from '@nestjs/common';
import { RolePolicyService } from './role-policy.service';

@Global()
@Module({
  providers: [RolePolicyService],
  exports: [RolePolicyService],
})
export class RolePolicyModule {}
