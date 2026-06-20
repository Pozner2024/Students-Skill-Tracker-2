import { describe, it, expect, afterEach, vi } from 'vitest'
import { parseQuestions, getTest } from './tests'

function mockFetchJson(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => 'application/json' },
    clone() {
      return this
    },
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(body)).buffer,
  })
}

afterEach(() => vi.restoreAllMocks())

describe('parseQuestions', () => {
  it('массив возвращает как есть', () => {
    const q = [{ type: 'multiple_choice' }]
    expect(parseQuestions(q)).toEqual(q)
  })
  it('строку парсит из JSON', () => {
    expect(parseQuestions('[{"type":"ordering"}]')).toEqual([{ type: 'ordering' }])
  })
  it('разворачивает вложенный .questions', () => {
    expect(parseQuestions({ questions: [{ type: 'matching' }] })).toEqual([{ type: 'matching' }])
  })
  it('некорректную строку → пустой массив', () => {
    expect(parseQuestions('не json')).toEqual([])
  })
})

describe('getTest', () => {
  it('успех: форматирует данные', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchJson({ testTitle: 'Тема', variant: 1, questions: [{ type: 'multiple_choice' }] }),
    )
    const res = await getTest('test1_1', 1)
    expect(res.success).toBe(true)
    expect(res.data?.questions).toHaveLength(1)
    expect(res.data?.testCode).toBe('test1_1')
  })
})
