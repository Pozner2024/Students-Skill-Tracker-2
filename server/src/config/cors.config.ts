import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:9000',
      'http://127.0.0.1:9000',
      'http://localhost:5000',
    ];

    const productionOrigins =
      process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];

    const allAllowedOrigins = [...allowedOrigins, ...productionOrigins];

    if (allAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
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
  optionsSuccessStatus: 200, // ✅ ВАЖНО! (браузеры ждут 200, не 204)
};
