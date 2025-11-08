//DTO (Data Transfer Objects) для работы с тестами.
// Определяют формат данных для запросов и ответов API.
//- GetTestDto — используется при получении теста по коду и варианту.
// - CreateTestDto — используется при создании нового теста.
//- TestResponseDto — структура данных, возвращаемых клиенту.
// Валидаторы из class-validator проверяют типы данных.
//class-transformer преобразует строки (например, "1") в числа.

import { IsString, IsNumber, IsObject, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetTestDto {
  @IsString()
  testCode: string;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  variant: number;
}

export class TestResponseDto {
  id: number;
  testCode: string;
  testTitle: string;
  variant: number;
  questions: any;
  createdAt: Date | null;
}

export class CreateTestDto {
  @IsString()
  testCode: string;

  @IsString()
  testTitle: string;

  @IsNumber()
  variant: number;

  @IsObject()
  questions: any;
}

export class SaveTestResultDto {
  @IsString()
  testCode: string;

  @IsNumber()
  variant: number;

  @IsNumber()
  score: number;

  @IsNumber()
  totalQuestions: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value === null || value === undefined ? null : Number(value)))
  maxPoints?: number | null;

  @IsNumber()
  percentage: number;

  @IsNumber()
  grade: number;

  @IsOptional()
  @IsObject({ each: true })
  answersDetails?: unknown[];
}