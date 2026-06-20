import { API_CONFIG } from './config'
import { http } from './http'
import type {
  TestData,
  TestImagesResult,
  TestQuestionData,
  TestResultMeta,
  TestResultPayload,
  SavedTestResult,
} from './types'

// Порт TestLoader.fetchTestData: questions может прийти строкой JSON, объектом,
// либо объектом с вложенным полем questions.
export function parseQuestions(raw: unknown): TestQuestionData[] {
  let questions: unknown = []
  try {
    if (typeof raw === 'string') {
      questions = JSON.parse(raw)
    } else if (raw && typeof raw === 'object') {
      questions = raw
    }
    if (
      questions &&
      typeof questions === 'object' &&
      Array.isArray((questions as { questions?: unknown }).questions)
    ) {
      questions = (questions as { questions: unknown[] }).questions
    }
  } catch {
    return []
  }
  return Array.isArray(questions) ? (questions as TestQuestionData[]) : []
}

export async function getTest(testCode: string, variant: number): Promise<TestResultMeta> {
  try {
    const data = await http.publicRequest<{
      testTitle?: string
      variant?: number | string
      questions?: unknown
    }>(API_CONFIG.ENDPOINTS.TEST_BY_CODE, {
      params: { testCode, variant },
      context: 'tests.getTest',
    })

    if (!data) return { success: false, data: null, topicName: 'Тест' }

    const formatted: TestData = {
      testCode,
      testTitle: data.testTitle || 'Тест',
      variant: data.variant ?? variant,
      questions: parseQuestions(data.questions),
    }
    return { success: true, data: formatted, topicName: data.testTitle || 'Тест' }
  } catch (error) {
    return {
      success: false,
      data: { testCode, testTitle: 'Тест', variant, questions: [] },
      topicName: 'Тест',
      error: (error as Error).message,
    }
  }
}

export async function getTestImages(
  topicId: number,
  variant: number,
  maxQuestions?: number,
): Promise<TestImagesResult> {
  try {
    const params: Record<string, number> = {}
    if (Number.isFinite(maxQuestions) && (maxQuestions as number) > 0) {
      params.maxQuestions = maxQuestions as number
    }
    const data = await http.publicRequest<{ success?: boolean; images?: Record<string, string> }>(
      `${API_CONFIG.ENDPOINTS.IMAGES}/${topicId}/${variant}`,
      { params, context: 'tests.getTestImages' },
    )
    if (data && data.images) return { success: true, images: data.images }
    return { success: true, images: {} }
  } catch {
    return { success: false, images: {} }
  }
}

export async function saveTestResult(
  payload: TestResultPayload,
): Promise<SavedTestResult | null> {
  try {
    const data = await http.post<{ success?: boolean; result?: SavedTestResult }>(
      API_CONFIG.ENDPOINTS.TEST_RESULTS.SAVE,
      payload,
      { context: 'tests.saveTestResult' },
    )
    return data && data.result ? data.result : null
  } catch {
    return null
  }
}
