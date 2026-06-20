import type { AdminTest } from '@/api/types'

export function escapeHtml(text: unknown): string {
  if (text === null || text === undefined) return ''
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function getTestTitle(test: AdminTest): string {
  return test?.test_title || test?.test_code || ''
}

export function getMaxPointsByCount(count?: number | null): number | null {
  return count === 10 || count === 15 ? 100 : null
}

// ВНИМАНИЕ: админская шкала отличается от теста (ровные диапазоны для 10).
export function getGradeByPercent(scorePercent: number, questionCount?: number): number {
  const gradingScale: Record<number, number[][]> = {
    10: [
      [1, 10, 1],
      [11, 20, 2],
      [21, 30, 3],
      [31, 40, 4],
      [41, 50, 5],
      [51, 60, 6],
      [61, 70, 7],
      [71, 80, 8],
      [81, 90, 9],
      [91, 100, 10],
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
  }
  const percent = Number.isFinite(scorePercent) ? scorePercent : 0
  const normalized = Math.max(0, Math.min(100, percent))
  const scale = gradingScale[questionCount ?? 10] || gradingScale[10]
  return scale.find(([min, max]) => normalized >= min && normalized <= max)?.[2] ?? 0
}

export function getGradeForTest(test: AdminTest): number | null {
  if (!test || typeof test.score !== 'number') return null
  const maxPoints =
    typeof test.max_points === 'number' && test.max_points > 0
      ? test.max_points
      : getMaxPointsByCount(test.total_questions)
  if (!maxPoints || maxPoints <= 0) return null
  const percentage = Math.round((test.score / maxPoints) * 100)
  return getGradeByPercent(percentage, test.total_questions)
}

export function formatDate(dateString?: string, includeTime = true): string {
  if (!dateString) return '-'
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  }
  return new Date(dateString).toLocaleDateString('ru-RU', options)
}

export function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return (value ?? '') as string
}

export function formatTestSummary(test: AdminTest): string {
  if (
    typeof test.score !== 'number' ||
    (typeof test.max_points !== 'number' && typeof test.total_questions !== 'number')
  ) {
    return '-'
  }
  const maxPoints =
    test.max_points ?? getMaxPointsByCount(test.total_questions) ?? test.total_questions
  return `${test.score} баллов из ${maxPoints}`
}
