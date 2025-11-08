// Guard для JWT аутентификации
// Используется с @UseGuards(JwtAuthGuard) для защиты маршрутов
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
