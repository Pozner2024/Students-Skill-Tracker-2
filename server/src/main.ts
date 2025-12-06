//Главный файл приложения NestJS — точка входа (main.ts).
//Здесь создаётся и настраивается экземпляр приложения:
// - подключается главный модуль (AppModule);
//- включается валидация входных данных (ValidationPipe);
//- подключается глобальный фильтр ошибок (HttpExceptionFilter);
//- настраивается политика CORS для безопасного доступа с клиентской части;
//- задаётся порт, на котором запускается сервер (по умолчанию 5000).

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ConsoleLogger } from '@nestjs/common';
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
