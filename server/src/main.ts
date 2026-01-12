//Главный файл приложения NestJS — точка входа (main.ts).
//Здесь создаётся и настраивается экземпляр приложения:
// - подключается главный модуль (AppModule);
//- включается валидация входных данных (ValidationPipe);
//- подключается глобальный фильтр ошибок (HttpExceptionFilter);
//- настраивается политика CORS для безопасного доступа с клиентской части;
//- задаётся порт, на котором запускается сервер (по умолчанию 5000).

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ConsoleLogger, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { corsConfig } from './config/cors.config';

// Кастомный logger, который скрывает логи о маппинге роутов
class CustomLogger extends ConsoleLogger {
  log(message: string, context?: string) {
    // Пропускаем логи от RouterExplorer и RoutesResolver
    if (context === 'RouterExplorer' || context === 'RoutesResolver') {
      return;
    }
    super.log(message, context);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger(),
  });

  // Устанавливаем кодировку UTF-8 для всех JSON ответов
  app.use((req: any, res: any, next: any) => {
    // Устанавливаем charset для JSON ответов
    const originalJson = res.json;
    res.json = function (body: any) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return originalJson.call(this, body);
    };
    next();
  });

  // Валидация
  // Отключаем валидацию для multipart/form-data запросов (загрузка файлов)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Пропускаем валидацию для multipart запросов
      skipMissingProperties: false,
      // Не валидируем, если Content-Type содержит multipart
      disableErrorMessages: false,
    }),
  );

  // Глобальный фильтр ошибок
  app.useGlobalFilters(new HttpExceptionFilter());

  // Обработка ошибок Multer до того, как они попадут в фильтр
  // Это гарантирует, что ошибки Multer всегда возвращаются как JSON
  app.use((err: any, req: any, res: any, next: any) => {
    // Проверяем, является ли это ошибкой Multer
    // Multer ошибки имеют код, начинающийся с 'LIMIT_' или имя 'MulterError'
    if (err && (err.code?.startsWith('LIMIT_') || err.name === 'MulterError')) {
      // Убеждаемся, что заголовки еще не отправлены
      if (!res.headersSent) {
        // Очищаем любые установленные заголовки
        res.removeHeader('Content-Type');
        // Устанавливаем правильный Content-Type
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      
      // Преобразуем ошибку Multer в HttpException
      const httpException = new BadRequestException(
        err.message || 'Ошибка при загрузке файла',
      );
      
      // Передаем в глобальный фильтр
      return next(httpException);
    }
    next(err);
  });

  // Разрешаем CORS
  app.enableCors({
    ...corsConfig,
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowedOrigins = [
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:9000',
        'http://127.0.0.1:9000',
        ...(process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || []),
      ];

      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
  });

  // Порт
  const port = process.env.PORT ?? 5000;
  await app.listen(port);

  console.log(`Server running on http://localhost:${port}`);
  console.log(`Client running on http://localhost:9000`);
}

// Без ошибок ESLint: ловим ошибки при старте
bootstrap().catch((err) => {
  console.error('Ошибка при запуске приложения:', err);
});
