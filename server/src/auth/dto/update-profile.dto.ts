import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'ФИО не должно превышать 255 символов' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Номер группы не должен превышать 50 символов' })
  groupNumber?: string;
}
