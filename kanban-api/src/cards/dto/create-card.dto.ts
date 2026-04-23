import { IsString, MinLength, IsOptional, IsInt } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @MinLength(1, { message: 'title is required' })
  title!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() due_date?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsInt() assigned_user_id?: number;
  @IsOptional() @IsInt() position?: number;
}

export class UpdateCardDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() due_date?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsInt() assigned_user_id?: number;
}

export class MoveCardDto {
  @IsInt({ message: 'column_id must be a number' })
  column_id!: number;

  @IsInt({ message: 'position must be a number' })
  position!: number;
}
