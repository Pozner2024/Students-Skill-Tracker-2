// JWT-стратегия для проверки подлинности токена и пользователя.
// Используется при доступе к защищённым маршрутам:
//  - Извлекает токен из заголовка Authorization
//  - Проверяет его действительность и срок
//  - Находит пользователя по данным токена через AuthService
//  - Если пользователь найден — добавляет его в request.user
// Работает в связке с JwtAuthGuard.

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.authService.validateUser(payload);
      if (!user) {
        this.logger.warn('JWT Strategy - user not found');
        throw new UnauthorizedException();
      }

      return user;
    } catch (error) {
      this.logger.error('JWT Strategy - validation error:', error);
      throw error;
    }
  }
}
