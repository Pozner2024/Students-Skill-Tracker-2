import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, validateLoginInput } from './validation'

describe('validation', () => {
  it('пустой/некорректный email даёт ошибку', () => {
    expect(validateEmail('')).toMatch(/email/i)
    expect(validateEmail('abc')).toMatch(/email/i)
    expect(validateEmail('a@b.c')).toBeNull()
  })
  it('пустой пароль даёт ошибку', () => {
    expect(validatePassword('')).toMatch(/пароль/i)
    expect(validatePassword('123')).toBeNull()
  })
  it('validateLoginInput возвращает первую ошибку или null', () => {
    expect(validateLoginInput('bad', '123')).toMatch(/email/i)
    expect(validateLoginInput('a@b.c', '')).toMatch(/пароль/i)
    expect(validateLoginInput('a@b.c', '123')).toBeNull()
  })
})
