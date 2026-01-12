// Глобальный фильтр ошибок (HttpExceptionFilter).
// Перехватывает все исключения, возникающие в приложении NestJS,
// и возвращает клиенту структурированный JSON-ответ с деталями ошибки.
// Используется для единообразной обработки ошибок и упрощённой отладки.
// В режиме разработки дополнительно выводит стек вызовов (stack trace).

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Внутренняя ошибка сервера';
    let details: unknown = undefined;

    // Убеждаемся, что ответ всегда будет JSON, даже если запрос был multipart
    // Это важно для обработки ошибок Multer
    if (!response.headersSent) {
      // Удаляем любые существующие заголовки Content-Type
      response.removeHeader('Content-Type');
      // Устанавливаем правильный Content-Type
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      // Если ответ - объект, извлекаем message из него
      if (typeof response === 'object' && response !== null && 'message' in response) {
        message = (response as { message: string }).message;
        // Сохраняем детали для отладки
        if ('error' in response || 'hint' in response) {
          details = response;
        }
      } else {
        message = exception.message;
      }
    } else {
      // Логируем полную ошибку для отладки
      this.logger.error('Unhandled error:', exception);
      if (exception instanceof Error && exception.message) {
        message = exception.message;
      }
    }

    const errorResponse: {
      statusCode: number;
      timestamp: string;
      path: string;
      method: string;
      message: string;
      stack?: string;
      details?: unknown;
    } = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      ...(details !== undefined && { details }),
      ...(process.env.NODE_ENV === 'development' &&
        exception instanceof Error && {
          stack: exception.stack,
        }),
    };

    response.status(status).json(errorResponse);
  }
}
