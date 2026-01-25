import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  ConsoleLogger,
  BadRequestException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
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

  // ✅ ИСПРАВЛЕННЫЙ CORS
  const corsOrigin: NonNullable<CorsOptions['origin']> = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    const allowedOrigins = [
      'http://localhost:9000',
      'http://localhost:3000',
      'http://127.0.0.1:9000',
      'http://127.0.0.1:3000',
      'https://students-skill-tracker-2.pages.dev',
      ...(process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || []),
    ];

    // разрешаем запросы без origin (Postman, OPTIONS)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // ❗️ ВАЖНО: НЕ бросаем Error
    return callback(null, false);
  };

  const corsOptions: CorsOptions = {
    credentials: true,
    origin: corsOrigin,
  };
  app.enableCors(corsOptions);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Ошибка при запуске приложения:', err);
});
