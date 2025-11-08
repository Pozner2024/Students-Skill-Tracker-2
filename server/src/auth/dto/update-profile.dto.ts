// DTO для обновления профиля пользователя с проверкой корректности данных
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(25, { message: 'ФИО не должно превышать 25 символов' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5, { message: 'Номер группы не должен превышать 5 символов' })
  groupNumber?: string;
}
