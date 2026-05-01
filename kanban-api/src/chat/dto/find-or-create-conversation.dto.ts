import { IsInt, Min } from 'class-validator';

export class FindOrCreateConversationDto {
  @IsInt()
  @Min(1)
  recipient_user_id!: number;
}
