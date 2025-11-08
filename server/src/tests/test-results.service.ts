//Сервис для работы с результатами тестов студентов.
//Основные функции:
//- getUserTestResults(userId): получает и сортирует результаты тестов пользователя.
//- saveTestResult(userId, testResultData): сохраняет новый результат теста в базе данных.

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TestResult } from '../auth/types/user.types';
import { SaveTestResultDto } from './dto/test.dto';

@Injectable()
export class TestResultsService {
  constructor(private prisma: PrismaService) {}

  async getUserTestResults(userId: number): Promise<TestResult[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { testResults: true },
    });

    const results = (user?.testResults as TestResult[]) || [];

    results.sort((a, b) => {
      const aTime = a?.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bTime = b?.completed_at ? new Date(b.completed_at).getTime() : 0;
      return bTime - aTime;
    });

    return results;
  }

  async saveTestResult(userId: number, testResultData: SaveTestResultDto) {
    const {
      testCode,
      variant,
      score,
      totalQuestions,
      maxPoints,
      grade,
      answersDetails,
    } = testResultData;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { testResults: true },
    });

    const currentResults: TestResult[] =
      (user?.testResults as TestResult[]) || [];

    const newResult: TestResult = {
      test_code: testCode,
      variant,
      score,
      total_questions: totalQuestions,
      max_points: maxPoints ?? null,
      grade,
      answers_details: answersDetails || [],
      completed_at: new Date().toISOString(),
    };

    const updatedResults: TestResult[] = [newResult, ...currentResults];

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        testResults: updatedResults as unknown as Prisma.InputJsonValue,
      },
    });

    return newResult;
  }
}
