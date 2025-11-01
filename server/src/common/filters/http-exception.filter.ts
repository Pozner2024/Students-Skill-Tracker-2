import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Внутренняя ошибка сервера';
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else {
      // Логируем полную ошибку для отладки
      console.error('❌ Unhandled error:', exception);
      if (exception.message) {
        message = exception.message;
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: exception.stack,
        details: exception 
      }),
    };

    response.status(status).json(errorResponse);
  }
}
