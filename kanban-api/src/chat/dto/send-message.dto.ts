import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  recipient_user_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  conversation_id?: number;

  @IsString()
  @MaxLength(2000)
  content!: string;
}
