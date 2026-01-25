// Контроллер для работы с темами.
// Эндпоинты:
// - GET /topics — получить все темы с вопросами и проектами.

import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { TopicDto } from './dto/topic.dto';

@Controller('topics')
export class TopicsController {
  private readonly logger = new Logger(TopicsController.name);

  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  async getAllTopics(): Promise<{ success: boolean; topics: TopicDto[] }> {
    try {
      const topics = await this.topicsService.getAllTopics();
      this.logger.log(`Получено ${topics.length} тем`);
      return {
        success: true,
        topics,
      };
    } catch (error) {
      this.logger.error('Ошибка при получении тем:', error);

      // Детальное логирование для отладки
      if (error instanceof Error) {
        this.logger.error(`Тип ошибки: ${error.constructor.name}`);
        this.logger.error(`Сообщение: ${error.message}`);
        this.logger.error(`Стек: ${error.stack}`);

        const errorMessage = error.message.toLowerCase();

        // Проверяем различные типы ошибок
        if (
          errorMessage.includes('does not exist') ||
          errorMessage.includes('relation') ||
          errorMessage.includes('table')
        ) {
          this.logger.error(
            'Таблица topics не существует в БД. Выполните миграции: npx prisma migrate deploy или npx prisma db push',
          );
          throw new HttpException(
            {
              message: 'Таблица topics не найдена в базе данных',
              hint: 'Выполните: npx prisma migrate deploy или npx prisma db push',
              error: error.message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        if (
          errorMessage.includes('unknown model') ||
          errorMessage.includes('prisma.topic')
        ) {
          this.logger.error(
            'Модель Topic не найдена в Prisma Client. Запустите: npx prisma generate',
          );
          throw new HttpException(
            {
              message: 'Модель Topic не найдена в Prisma Client',
              hint: 'Запустите: npx prisma generate',
              error: error.message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      throw new HttpException(
        {
          message: 'Ошибка при получении тем',
          error: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('test')
  async testConnection() {
    this.logger.log('Тестовый endpoint вызван');
    try {
      // Проверяем, доступен ли Prisma Client
      const prismaCheck = typeof this.topicsService['prisma'] !== 'undefined';
      this.logger.log(`Prisma Service доступен: ${prismaCheck}`);

      // Проверяем, есть ли метод topic
      const topicMethodCheck =
        typeof this.topicsService['prisma']?.topic !== 'undefined';
      this.logger.log(`Метод prisma.topic доступен: ${topicMethodCheck}`);

      return {
        success: true,
        message: 'Тестовый endpoint работает',
        checks: {
          prismaAvailable: prismaCheck,
          topicMethodAvailable: topicMethodCheck,
        },
      };
    } catch (error) {
      this.logger.error('Ошибка в тестовом endpoint:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Get(':id')
  async getTopicById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; topic: TopicDto | null }> {
    const topic = await this.topicsService.getTopicById(id);
    return {
      success: true,
      topic,
    };
  }

  @Put(':id/content')
  async updateTopicContent(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { content: any },
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`[updateTopicContent] Получен запрос для topic id: ${id}`);
      this.logger.log(`[updateTopicContent] Тип content: ${typeof body.content}`);
      this.logger.log(`[updateTopicContent] Является строкой: ${typeof body.content === 'string'}`);
      this.logger.log(`[updateTopicContent] Является объектом: ${typeof body.content === 'object' && body.content !== null}`);
      if (typeof body.content === 'string') {
        this.logger.log(`[updateTopicContent] Первые 200 символов content: ${body.content.substring(0, 200)}`);
      } else {
        this.logger.log(`[updateTopicContent] Content (JSON): ${JSON.stringify(body.content).substring(0, 300)}`);
      }
      return await this.topicsService.updateTopicContent(id, body.content);
    } catch (error) {
      this.logger.error('Ошибка при обновлении content:', error);
      throw new HttpException(
        {
          message: 'Ошибка при обновлении содержания темы',
          error: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
