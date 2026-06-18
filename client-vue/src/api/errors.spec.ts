import { describe, it, expect } from 'vitest'
import { getErrorMessage, isAuthError } from './errors'

describe('isAuthError', () => {
  it('ловит 401/unauthorized/токен', () => {
    expect(isAuthError(new Error('Unauthorized'))).toBe(true)
    expect(isAuthError(new Error('HTTP 401'))).toBe(true)
    expect(isAuthError(new Error('Неверный токен'))).toBe(true)
    expect(isAuthError(new Error('что-то другое'))).toBe(false)
  })
})

describe('getErrorMessage', () => {
  it('возвращает строку как есть', () => {
    expect(getErrorMessage('Ошибка входа')).toBe('Ошибка входа')
  })
  it('для timeout даёт сообщение о времени ожидания', () => {
    expect(getErrorMessage(new Error('timeout 30000ms'))).toMatch(/время ожидания/i)
  })
})
