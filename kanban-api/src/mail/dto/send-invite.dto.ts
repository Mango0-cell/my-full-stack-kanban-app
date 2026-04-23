import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendInviteDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
