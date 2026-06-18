import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, removeToken, hasValidToken } from './tokenStorage'

describe('tokenStorage', () => {
  beforeEach(() => localStorage.clear())

  it('сохраняет и читает токен', () => {
    setToken('abc')
    expect(getToken()).toBe('abc')
    expect(hasValidToken()).toBe(true)
  })

  it('строку "undefined" считает невалидной и удаляет', () => {
    setToken('undefined')
    expect(getToken()).toBeNull()
    expect(hasValidToken()).toBe(false)
  })

  it('removeToken очищает', () => {
    setToken('abc')
    removeToken()
    expect(getToken()).toBeNull()
  })
})
