// Контроллер для работы с изображениями вопросов тестирования
//Предоставляет API для получения URL изображений, проверки их наличия
//и массового получения изображений для конкретных тем и вариантов тестов.
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Logger,
} from '@nestjs/common';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  private readonly logger = new Logger(ImagesController.name);

  constructor(private readonly imagesService: ImagesService) {}

  /**
   * Получает URL изображения для конкретного вопроса
   * GET /images/:topicId/:variant/:questionNumber
   */
  @Get(':topicId/:variant/:questionNumber')
  async getImageUrl(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Param('variant', ParseIntPipe) variant: number,
    @Param('questionNumber', ParseIntPipe) questionNumber: number,
  ) {
    const url = await this.imagesService.getImageUrl(
      topicId,
      variant,
      questionNumber,
    );

    return {
      success: url !== null,
      url,
      topicId,
      variant,
      questionNumber,
    };
  }

  /**
   * Получает все изображения для темы и варианта
   * GET /images/:topicId/:variant
   */
  @Get(':topicId/:variant')
  async getImagesForTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Param('variant', ParseIntPipe) variant: number,
    @Query('maxQuestions') maxQuestions?: string,
  ) {
    const maxQuestionsNum = maxQuestions ? parseInt(maxQuestions, 10) : 20;
    const images = await this.imagesService.getImagesForTopic(
      topicId,
      variant,
      maxQuestionsNum,
    );

    return {
      success: true,
      topicId,
      variant,
      images,
      count: Object.keys(images).length,
    };
  }

  /**
   * Проверяет существование изображения
   * GET /images/:topicId/:variant/:questionNumber/exists
   */
  @Get(':topicId/:variant/:questionNumber/exists')
  async checkImageExists(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Param('variant', ParseIntPipe) variant: number,
    @Param('questionNumber', ParseIntPipe) questionNumber: number,
  ) {
    const exists = await this.imagesService.imageExists(
      topicId,
      variant,
      questionNumber,
    );

    return {
      success: true,
      exists,
      topicId,
      variant,
      questionNumber,
    };
  }
}
