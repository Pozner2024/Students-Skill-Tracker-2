//Сервис для работы с результатами тестов студентов.
//Основные функции:
//- getUserTestResults(userId): получает и сортирует результаты тестов пользователя.
//- saveTestResult(userId, testResultData): сохраняет новый результат теста в базе данных.

import { Injectable } from '@nestjs/common';
import type { InputJsonValue } from '@prisma/client/runtime/library';
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

    // 🔹 Получаем все уникальные test_code для загрузки названий из БД
    const testCodes = new Set<string>();
    for (const result of results) {
      if (result?.test_code && typeof result.test_code === 'string') {
        testCodes.add(result.test_code);
      }
    }

    // 🔹 Загружаем названия тестов из базы данных одним запросом
    const testTitlesMap = new Map<string, string>();
    if (testCodes.size > 0) {
      const tests = await this.prisma.tests.findMany({
        where: {
          test_code: {
            in: Array.from(testCodes),
          },
        },
        select: {
          test_code: true,
          test_title: true,
        },
      });

      // Группируем по test_code, оставляя первое вхождение
      for (const test of tests) {
        if (!testTitlesMap.has(test.test_code)) {
          testTitlesMap.set(test.test_code, test.test_title);
        }
      }
    }

    // 🔹 Добавляем названия тестов к результатам
    const resultsWithTitles = results.map((result) => {
      const testCode =
        result?.test_code && typeof result.test_code === 'string'
          ? result.test_code
          : null;
      return {
        ...result,
        test_title: testCode ? (testTitlesMap.get(testCode) ?? null) : null,
      };
    });

    resultsWithTitles.sort((a, b) => {
      const aTime = a?.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bTime = b?.completed_at ? new Date(b.completed_at).getTime() : 0;
      return bTime - aTime;
    });

    return resultsWithTitles;
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
        testResults: updatedResults as unknown as InputJsonValue,
      },
    });

    return newResult;
  }
}
