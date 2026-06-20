import { describe, it, expect } from 'vitest'
import {
  getGradeByPercent,
  getGradeForTest,
  getMaxPointsByCount,
  formatTestSummary,
} from './adminFormat'

describe('getMaxPointsByCount', () => {
  it('10 и 15 → 100', () => {
    expect(getMaxPointsByCount(10)).toBe(100)
    expect(getMaxPointsByCount(15)).toBe(100)
  })
  it('иное → null', () => {
    expect(getMaxPointsByCount(7)).toBeNull()
  })
})

describe('getGradeByPercent (админская шкала, ровные диапазоны для 10)', () => {
  it('5% (10 вопросов) → 1', () => {
    expect(getGradeByPercent(5, 10)).toBe(1)
  })
  it('100% (10 вопросов) → 10', () => {
    expect(getGradeByPercent(100, 10)).toBe(10)
  })
  it('45% (10 вопросов) → 5', () => {
    expect(getGradeByPercent(45, 10)).toBe(5)
  })
})

describe('getGradeForTest', () => {
  it('score 100/100 на 10 вопросов → 10', () => {
    expect(getGradeForTest({ score: 100, max_points: 100, total_questions: 10 })).toBe(10)
  })
  it('нет score → null', () => {
    expect(getGradeForTest({ total_questions: 10 })).toBeNull()
  })
})

describe('formatTestSummary', () => {
  it('баллы из максимума', () => {
    expect(formatTestSummary({ score: 80, max_points: 100, total_questions: 10 })).toBe(
      '80 баллов из 100',
    )
  })
})
