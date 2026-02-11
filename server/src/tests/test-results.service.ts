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

    const computeMaxPointsByCount = (count?: number | null) => {
      if (count === 10) return 100;
      if (count === 15) return 100;
      return null;
    };

    const getGradeByPercent = (scorePercent: number, questionCount?: number) => {
      const gradingScale: Record<number, Array<[number, number, number]>> = {
        10: [
          [1, 8, 1],
          [9, 16, 2],
          [17, 27, 3],
          [28, 38, 4],
          [39, 49, 5],
          [50, 65, 6],
          [66, 76, 7],
          [86, 90, 8],
          [91, 95, 9],
          [96, 100, 10],
        ],
        15: [
          [1, 8, 1],
          [9, 16, 2],
          [17, 26, 3],
          [27, 36, 4],
          [37, 48, 5],
          [49, 59, 6],
          [60, 70, 7],
          [71, 80, 8],
          [81, 91, 9],
          [92, 100, 10],
        ],
      };

      const percent = Number.isFinite(scorePercent) ? scorePercent : 0;
      const normalized = Math.max(0, Math.min(100, percent));
      const scale = gradingScale[questionCount ?? 10] || gradingScale[10];
      if (normalized === 0) {
        return 1;
      }
      return (
        scale.find(([min, max]) => normalized >= min && normalized <= max)?.[2] ??
        1
      );
    };

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
      const totalQuestions =
        typeof result?.total_questions === 'number'
          ? result.total_questions
          : null;
      const score = typeof result?.score === 'number' ? result.score : null;
      const resolvedMaxPoints =
        typeof result?.max_points === 'number' && result.max_points > 0
          ? result.max_points
          : computeMaxPointsByCount(totalQuestions);
      const computedGrade =
        score !== null && resolvedMaxPoints && resolvedMaxPoints > 0
          ? getGradeByPercent(
              Math.round((score / resolvedMaxPoints) * 100),
              totalQuestions ?? undefined,
            )
          : (typeof result?.grade === 'number' ? result.grade : null) ?? null;

      return {
        ...result,
        test_title: testCode ? (testTitlesMap.get(testCode) ?? null) : null,
        max_points: resolvedMaxPoints ?? null,
        grade: computedGrade,
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

    const computeMaxPointsByCount = (count?: number | null) => {
      if (count === 10) return 100;
      if (count === 15) return 100;
      return null;
    };

    const getGradeByPercent = (scorePercent: number, questionCount?: number) => {
      const gradingScale: Record<number, Array<[number, number, number]>> = {
        10: [
          [1, 8, 1],
          [9, 16, 2],
          [17, 27, 3],
          [28, 38, 4],
          [39, 49, 5],
          [50, 65, 6],
          [66, 76, 7],
          [86, 90, 8],
          [91, 95, 9],
          [96, 100, 10],
        ],
        15: [
          [1, 8, 1],
          [9, 16, 2],
          [17, 26, 3],
          [27, 36, 4],
          [37, 48, 5],
          [49, 59, 6],
          [60, 70, 7],
          [71, 80, 8],
          [81, 91, 9],
          [92, 100, 10],
        ],
      };

      const percent = Number.isFinite(scorePercent) ? scorePercent : 0;
      const normalized = Math.max(0, Math.min(100, percent));
      const scale = gradingScale[questionCount ?? 10] || gradingScale[10];
      if (normalized === 0) {
        return 1;
      }
      return (
        scale.find(([min, max]) => normalized >= min && normalized <= max)?.[2] ??
        1
      );
    };

    const resolvedMaxPoints =
      typeof maxPoints === 'number' && maxPoints > 0
        ? maxPoints
        : computeMaxPointsByCount(totalQuestions);
    const computedGrade =
      typeof score === 'number' && resolvedMaxPoints && resolvedMaxPoints > 0
        ? getGradeByPercent(
            Math.round((score / resolvedMaxPoints) * 100),
            totalQuestions,
          )
        : (typeof grade === 'number' ? grade : null) ?? null;

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
      max_points: resolvedMaxPoints ?? null,
      grade: computedGrade,
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
