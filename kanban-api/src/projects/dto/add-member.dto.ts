import { IsString, IsEmail, IsIn, IsOptional, MaxLength, MinLength } from 'class-validator';

const ALLOWED_PROJECT_MEMBER_ROLES = ['admin', 'editor', 'member', 'viewer'] as const;

export class AddMemberDto {
  @IsEmail({}, { message: 'Invalid email address' })
  user_email!: string;

  @IsString()
  @IsIn(ALLOWED_PROJECT_MEMBER_ROLES, {
    message: `role_name must be one of: ${ALLOWED_PROJECT_MEMBER_ROLES.join(', ')}`,
  })
  role_name!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message?: string;
}

export class UpdateMemberRoleDto {
  @IsString()
  @IsIn(ALLOWED_PROJECT_MEMBER_ROLES, {
    message: `role_name must be one of: ${ALLOWED_PROJECT_MEMBER_ROLES.join(', ')}`,
  })
  role_name!: string;
}
