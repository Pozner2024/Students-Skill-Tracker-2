import { IsString, MinLength, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Введите корректный email адрес' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Введите корректный email адрес' })
  email: string;

  @IsString()
  password: string;
}
