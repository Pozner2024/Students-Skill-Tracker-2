// Контроллер для работы с результатами тестов пользователей.
// Эндпоинты:
//- GET /test-results — получить результаты текущего пользователя.
//- POST /test-results — сохранить новый результат теста.
// Доступ только для авторизованных пользователей (JWT Guard).
//Использует TestResultsService для логики сохранения и получения данных.
//Все ошибки логируются через встроенный Logger NestJS.

import {
  Controller,
  Get,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { TestResultsService } from './test-results.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtUser } from '../auth/types/user.types';
import { SaveTestResultDto } from './dto/test.dto';

@Controller('test-results')
export class TestResultsController {
  private readonly logger = new Logger(TestResultsController.name);

  constructor(private testResultsService: TestResultsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getTestResults(@GetUser() user: JwtUser) {
    try {
      const testResults = await this.testResultsService.getUserTestResults(
        user.id,
      );

      return {
        success: true,
        results: testResults,
      };
    } catch (error) {
      this.logger.error('Error getting test results:', error);
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async saveTestResult(
    @GetUser() user: JwtUser,
    @Body(ValidationPipe) testResultData: SaveTestResultDto,
  ) {
    try {
      // ValidationPipe гарантирует корректный тип SaveTestResultDto во время выполнения
      // Предупреждение линтера о типе TestResultData - ложное срабатывание (кэш старого типа)
      const savedResult = await this.testResultsService.saveTestResult(
        user.id,
        testResultData,
      );

      return {
        success: true,
        result: savedResult,
      };
    } catch (error) {
      this.logger.error('Error saving test result:', error);
      throw error;
    }
  }
}
