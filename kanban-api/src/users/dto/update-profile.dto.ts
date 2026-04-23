import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() display_name?: string;
  @IsOptional() @IsString() avatar_url?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() theme?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsString() job_title?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() website_url?: string;
  @IsOptional() notification_settings?: unknown;
}
