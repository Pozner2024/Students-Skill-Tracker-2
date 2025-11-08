// Сервис для работы с темами из базы данных.
// Получает темы с их вопросами и проектами.

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TopicDto } from './dto/topic.dto';

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(private prisma: PrismaService) {}

  async getAllTopics(): Promise<TopicDto[]> {
    try {
      const topics = await this.prisma.topic.findMany({
        include: {
          questions: {
            orderBy: {
              id: 'asc',
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      });

      this.logger.log(`Найдено ${topics.length} тем в БД`);

      return topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        project: {
          name: topic.project_name,
          description: topic.project_description,
        },
        questions: topic.questions.map((q) => q.text),
      }));
    } catch (error) {
      this.logger.error('Ошибка при запросе к БД:', error);

      // Детальное логирование ошибки
      if (error instanceof Error) {
        this.logger.error(`Сообщение ошибки: ${error.message}`);
        this.logger.error(`Стек ошибки: ${error.stack}`);

        // Проверяем, является ли это ошибкой отсутствия модели
        if (
          error.message.includes('Unknown model') ||
          error.message.includes('topic')
        ) {
          this.logger.error(
            'Модель Topic не найдена в Prisma Client. Запустите: npx prisma generate',
          );
        }
      }

      throw error;
    }
  }

  async getTopicById(id: number): Promise<TopicDto | null> {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!topic) {
      return null;
    }

    return {
      id: topic.id,
      name: topic.name,
      project: {
        name: topic.project_name,
        description: topic.project_description,
      },
      questions: topic.questions.map((q) => q.text),
    };
  }
}
