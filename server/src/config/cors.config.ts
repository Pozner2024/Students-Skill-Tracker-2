//Конфигурация CORS (Cross-Origin Resource Sharing) для NestJS приложения
// Настройки определяют, какие домены могут обращаться к API, какие методы
//и заголовки разрешены. Включает безопасную обработку для development и production.
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost:9000',
      'http://127.0.0.1:9000',
    ];

    const productionOrigins =
      process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];

    const allAllowedOrigins = [...allowedOrigins, ...productionOrigins];

    if (allAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Requested-With',
    'Origin',
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200,
};
