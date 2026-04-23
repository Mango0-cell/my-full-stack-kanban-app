import { IsString, MinLength, IsOptional, IsInt } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @MinLength(1, { message: 'name is required' })
  name!: string;

  @IsOptional()
  @IsInt()
  position?: number;
}

export class UpdateColumnDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() position?: number;
}
