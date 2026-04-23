import { IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

const ALLOWED_INVITATION_ROLES = ['admin', 'editor', 'member', 'viewer'] as const;

export class CreateInvitationDto {
  @IsInt()
  @Min(1)
  project_id!: number;

  @IsEmail()
  email!: string;

  @IsString()
  @IsIn(ALLOWED_INVITATION_ROLES, {
    message: `role_name must be one of: ${ALLOWED_INVITATION_ROLES.join(', ')}`,
  })
  role_name!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message?: string;
}
