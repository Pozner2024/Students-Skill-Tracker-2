import { describe, it, expect } from 'vitest'
import { ScoreCalculator } from './testScoring'
import type { TestData } from '@/api/types'

function makeTest(questions: TestData['questions']): TestData {
  return { testCode: 't', testTitle: 'T', variant: 1, questions }
}

describe('ScoreCalculator.getMaxScore', () => {
  it('для 10 вопросов сумма шкалы = 100', () => {
    const q = Array.from({ length: 10 }, () => ({ type: 'multiple_choice' as const }))
    expect(new ScoreCalculator(makeTest(q)).getMaxScore()).toBe(100)
  })
  it('для нестандартного числа вопросов = 0', () => {
    const q = Array.from({ length: 3 }, () => ({ type: 'multiple_choice' as const }))
    expect(new ScoreCalculator(makeTest(q)).getMaxScore()).toBe(0)
  })
})

describe('ScoreCalculator.calculateTotalScore (multiple_choice)', () => {
  it('правильный первый ответ даёт баллы шкалы', () => {
    const q = Array.from({ length: 10 }, (_, i) => ({
      type: 'multiple_choice' as const,
      correct_answer: `ans${i}`,
    }))
    const calc = new ScoreCalculator(makeTest(q))
    const answers = q.map((qq) => qq.correct_answer as string)
    expect(calc.calculateTotalScore(answers)).toBe(100)
  })
  it('неверные ответы → 0', () => {
    const q = Array.from({ length: 10 }, () => ({
      type: 'multiple_choice' as const,
      correct_answer: 'верно',
    }))
    const calc = new ScoreCalculator(makeTest(q))
    expect(calc.calculateTotalScore(q.map(() => 'неверно'))).toBe(0)
  })
})

describe('ScoreCalculator.getGrade', () => {
  it('0% → 1', () => {
    const calc = new ScoreCalculator(makeTest([]))
    expect(calc.getGrade(0, 10)).toBe(1)
  })
  it('100% (10 вопросов) → 10', () => {
    const calc = new ScoreCalculator(makeTest([]))
    expect(calc.getGrade(100, 10)).toBe(10)
  })
})

describe('ScoreCalculator.getAnsweredPercentage', () => {
  it('половина отвечено → 50', () => {
    const q = Array.from({ length: 10 }, () => ({ type: 'multiple_choice' as const }))
    const calc = new ScoreCalculator(makeTest(q))
    const answers = ['a', 'b', 'c', 'd', 'e', undefined, undefined, undefined, undefined, undefined]
    expect(calc.getAnsweredPercentage(answers as unknown[])).toBe(50)
  })
})
