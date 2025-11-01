import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { YandexCloudConfig } from '../config/yandex-cloud.config';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  private readonly s3Client: S3Client;

  constructor(private configService: ConfigService) {
    // Получаем типизированную конфигурацию
    const config = this.configService.get<YandexCloudConfig>('yandexCloud')!;

    this.logger.log(`Инициализация Yandex Cloud с конфигурацией:`, {
      region: config.region,
      endpoint: config.endpoint,
      bucketName: config.bucketName,
      hasAccessKey: !!config.accessKeyId,
      hasSecretKey: !!config.secretAccessKey,
    });

    this.s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Необходимо для Yandex Cloud
    });
  }

  /**
   * Получает URL изображения из Yandex Cloud Object Storage
   * @param topicId - ID темы (например, 1, 2, 3...)
   * @param variant - Вариант (1 или 2)
   * @param questionNumber - Номер вопроса (1, 2, 3...)
   * @returns Promise<string> - URL изображения или null если не найдено
   */
  async getImageUrl(
    topicId: number,
    variant: number,
    questionNumber: number,
  ): Promise<string | null> {
    try {
      const config = this.configService.get<YandexCloudConfig>('yandexCloud')!;
      const key = `img${topicId}_${variant}/${questionNumber}.jpg`;

      this.logger.log(`Попытка получить изображение: ${key} из бакета ${config.bucketName}`);

      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      });

      // Создаем подписанный URL, действительный в течение 1 часа
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600, // 1 час
      });

      this.logger.log(`Generated signed URL for image: ${key}`);
      return signedUrl;
    } catch (error) {
      this.logger.warn(
        `Image not found: img${topicId}_${variant}/${questionNumber}.jpg. Error: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Получает массив URL для всех изображений темы и варианта
   * @param topicId - ID темы
   * @param variant - Вариант
   * @param maxQuestions - Максимальное количество вопросов для проверки
   * @returns Promise<Record<number, string>> - Объект с номерами вопросов и их URL
   */
  async getImagesForTopic(
    topicId: number,
    variant: number,
    maxQuestions: number = 20,
  ): Promise<Record<number, string>> {
    const images: Record<number, string> = {};

    // Проверяем изображения от 1 до maxQuestions
    for (let i = 1; i <= maxQuestions; i++) {
      const url = await this.getImageUrl(topicId, variant, i);
      if (url) {
        images[i] = url;
      }
    }

    return images;
  }

  /**
   * Проверяет существование изображения в хранилище
   * @param topicId - ID темы
   * @param variant - Вариант
   * @param questionNumber - Номер вопроса
   * @returns Promise<boolean> - true если изображение существует
   */
  async imageExists(
    topicId: number,
    variant: number,
    questionNumber: number,
  ): Promise<boolean> {
    const url = await this.getImageUrl(topicId, variant, questionNumber);
    return url !== null;
  }
}
