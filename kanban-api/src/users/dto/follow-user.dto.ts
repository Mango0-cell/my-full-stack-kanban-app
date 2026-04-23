import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class FollowUserDto {
  @IsInt()
  @Min(1)
  followed_user_id!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;
}
