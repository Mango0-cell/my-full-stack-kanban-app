import { IsString, IsOptional } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional() @IsString() project_name?: string;
  @IsOptional() @IsString() description?: string;
}
