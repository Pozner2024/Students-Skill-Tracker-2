//Middleware для логирования CORS-запросов
//Логирует информацию о кросс-доменных запросах и preflight OPTIONS запросах.
//Помогает в отладке взаимодействия между фронтендом и бэкендом при работе с CORS.

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorsLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;
    const method = req.method;
    const url = req.url;

    // Логируем только CORS-связанные запросы
    if (origin || method === 'OPTIONS') {
      this.logger.log(
        `CORS Request: ${method} ${url} from origin: ${origin || 'no-origin'}`,
      );
    }

    next();
  }
}
