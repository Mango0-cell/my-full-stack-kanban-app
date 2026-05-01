import { IsInt, Min } from 'class-validator';

export class UnarchiveCanceledCardDto {
  @IsInt()
  @Min(1)
  target_column_id!: number;
}
