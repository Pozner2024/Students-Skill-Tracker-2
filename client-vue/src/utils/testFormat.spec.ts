import { describe, it, expect } from 'vitest'
import { formatUnits, parseFillInBlanks } from './testFormat'

describe('formatUnits', () => {
  it('ставит неразрывный пробел перед %', () => {
    expect(formatUnits('влажность 70 %')).toBe('влажность 70\u00a0%')
  })
  it('ставит неразрывный пробел перед °C', () => {
    expect(formatUnits('температура 4 °C')).toContain('4\u00a0°C')
  })
  it('пустую строку возвращает как есть', () => {
    expect(formatUnits('')).toBe('')
  })
})

describe('parseFillInBlanks', () => {
  it('один пропуск даёт html + input + html', () => {
    const seg = parseFillInBlanks('Вода кипит при ___ градусов', [])
    const inputs = seg.filter((s) => s.kind === 'input')
    expect(inputs).toHaveLength(1)
    expect(inputs[0]).toMatchObject({ blankIndex: 0 })
  })
  it('подставляет сохранённый ответ', () => {
    const seg = parseFillInBlanks('Ответ: ___', ['100'])
    const input = seg.find((s) => s.kind === 'input')
    expect(input).toMatchObject({ value: '100' })
  })
  it('переносит пунктуацию после пропуска', () => {
    const seg = parseFillInBlanks('Список: ___, ___.', [])
    const inputs = seg.filter((s) => s.kind === 'input')
    expect(inputs).toHaveLength(2)
  })
})
