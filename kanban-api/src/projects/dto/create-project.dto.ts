import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1, { message: 'project_name is required' })
  project_name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
