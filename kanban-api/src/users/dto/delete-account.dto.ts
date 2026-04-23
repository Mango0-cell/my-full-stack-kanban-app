import { IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @MinLength(1, { message: 'password is required' })
  password!: string;
}
