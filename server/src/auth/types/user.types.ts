/// В этом файле собраны типы и интерфейсы, описывающие структуру данных JWT-токенов,
// пользователей и результатов тестов. Используются для типизации и удобного обмена данными
// между модулями авторизации, пользователей и тестов.

export interface JwtPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface JwtUser {
  id: number;
  email: string;
}

export interface TestResult {
  grade?: number | null;
  completed_at?: string | Date | null;
  test_code?: string | null;
  test_title?: string | null; // Название теста из базы данных
  answers_details?: any[];
  score?: number | null;
  total_questions?: number | null;
  variant?: number | null;
  max_points?: number | null;
}

export interface UserWithTestResults {
  id: number;
  email: string;
  fullName: string | null;
  groupNumber: string | null;
  testResults: TestResult[];
}

export interface StudentWithTests {
  id: number;
  email: string;
  fullName: string;
  groupNumber: string;
  tests: TestResult[];
}
