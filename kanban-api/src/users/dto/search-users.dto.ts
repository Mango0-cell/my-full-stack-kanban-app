import { IsOptional, IsString, MinLength } from 'class-validator';

export class SearchUsersDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  email?: string;
}
