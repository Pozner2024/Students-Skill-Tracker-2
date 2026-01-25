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
        content: topic.content,
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
      content: topic.content,
    };
  }

  async updateTopicContent(
    id: number,
    content: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`[updateTopicContent] Сохранение в БД для topic id: ${id}`);
      this.logger.log(`[updateTopicContent] Тип content перед сохранением: ${typeof content}`);
      
      // Если content - это HTML строка, оборачиваем её в JSON объект
      let contentToSave = content;
      if (typeof content === 'string') {
        this.logger.log(`[updateTopicContent] Content - строка, оборачиваем в JSON объект`);
        this.logger.log(`[updateTopicContent] Первые 200 символов: ${content.substring(0, 200)}`);
        // Оборачиваем HTML в JSON объект для правильного хранения в JSONB
        contentToSave = { html: content };
      } else if (typeof content === 'object' && content !== null) {
        this.logger.log(`[updateTopicContent] Content уже объект, сохраняем как есть`);
        this.logger.log(`[updateTopicContent] Content (JSON): ${JSON.stringify(content).substring(0, 300)}`);
      }
      
      await this.prisma.topic.update({
        where: { id },
        data: { content: contentToSave },
      });

      this.logger.log(`Обновлено поле content для темы с id: ${id}`);
      return {
        success: true,
        message: 'Содержание темы успешно обновлено',
      };
    } catch (error) {
      this.logger.error('Ошибка при обновлении content:', error);
      throw error;
    }
  }
}
