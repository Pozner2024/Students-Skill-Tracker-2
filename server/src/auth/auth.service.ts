// Сервис авторизации (AuthService).
// Отвечает за регистрацию, вход и проверку пользователей.
// Использует Prisma для работы с базой данных, Argon2 для хеширования паролей
// и JwtService для генерации токенов доступа (JWT).
//
// Основные методы:
// - register(): регистрирует нового пользователя, хеширует пароль и создаёт токен;
// - login(): проверяет введённый email и пароль, возвращает JWT при успешной аутентификации;
// - validateUser(): проверяет валидность пользователя по данным токена (используется в стратегии JWT).

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtPayload } from './types/user.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    let hashedPassword: string;
    try {
      hashedPassword = await argon2.hash(password);
    } catch (error) {
      throw new ConflictException('Ошибка при хешировании пароля');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Находим пользователя
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Проверяем пароль
    try {
      const isPasswordValid = await argon2.verify(user.password, password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Неверный email или пароль');
      }
    } catch (error) {
      // Argon2 выбрасывает исключение при неверном пароле или неверном формате хеша
      // Если это уже UnauthorizedException, пробрасываем дальше
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // В остальных случаях (неверный пароль, неверный формат хеша) - ошибка авторизации
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Генерируем JWT токен
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (user) {
      return {
        id: user.id,
        email: user.email,
      };
    }
    return null;
  }
}
