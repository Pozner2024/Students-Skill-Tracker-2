import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  ConsoleLogger,
  BadRequestException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Кастомный logger (прячем лишние логи Nest)
class CustomLogger extends ConsoleLogger {
  log(message: string, context?: string) {
    if (context === 'RouterExplorer' || context === 'RoutesResolver') {
      return;
    }
    super.log(message, context);
  }
}

type MulterLikeError = {
  code?: string;
  name?: string;
  message?: string;
};

const isMulterLikeError = (err: unknown): err is MulterLikeError => {
  if (!err || typeof err !== 'object') return false;
  const e = err as MulterLikeError;
  return Boolean(e.code || e.name || e.message);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger(),
  });

  app.setGlobalPrefix('api');

  // UTF-8 для всех JSON ответов
  app.use((_req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res) as Response['json'];
    const jsonWithUtf8: Response['json'] = (body: unknown) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return originalJson(body);
    };
    res.json = jsonWithUtf8;
    next();
  });

  // Валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Глобальный фильтр ошибок
  app.useGlobalFilters(new HttpExceptionFilter());

  // Обработка ошибок multer
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (
      isMulterLikeError(err) &&
      (err.code?.startsWith('LIMIT_') || err.name === 'MulterError')
    ) {
      if (!res.headersSent) {
        res.removeHeader('Content-Type');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }

      return next(
        new BadRequestException(err.message ?? 'Ошибка загрузки файла'),
      );
    }
    next(err);
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(` Server running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Ошибка при запуске приложения:', err);
});
