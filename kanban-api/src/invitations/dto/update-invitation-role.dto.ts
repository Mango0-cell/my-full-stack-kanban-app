import { IsIn, IsString } from 'class-validator';

const ALLOWED_ROLES = ['admin', 'editor', 'member', 'viewer'] as const;

export class UpdateInvitationRoleDto {
  @IsString()
  @IsIn(ALLOWED_ROLES, {
    message: `role_name must be one of: ${ALLOWED_ROLES.join(', ')}`,
  })
  role_name!: string;
}
