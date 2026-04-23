import { IsIn, IsOptional } from 'class-validator';

export class ListNotificationsDto {
  @IsOptional()
  @IsIn([5, 10])
  limit?: number = 5;
}
