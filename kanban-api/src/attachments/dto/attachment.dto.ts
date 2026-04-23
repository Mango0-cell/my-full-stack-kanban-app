import { IsString, MinLength } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  @MinLength(1, { message: 'file_url is required' })
  file_url!: string;

  @IsString()
  @MinLength(1, { message: 'file_name is required' })
  file_name!: string;
}
