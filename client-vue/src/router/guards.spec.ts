import { describe, it, expect } from 'vitest'
import { decideRedirect } from './guards'

describe('decideRedirect', () => {
  it('неавторизованного с приватной страницы шлёт на /login', () => {
    expect(decideRedirect('/profile', false)).toBe('/login')
  })
  it('неавторизованного на публичную пускает', () => {
    expect(decideRedirect('/about', false)).toBeNull()
  })
  it('авторизованного с /login шлёт на /', () => {
    expect(decideRedirect('/login', true)).toBe('/')
  })
  it('админа с /profile шлёт на /admin', () => {
    expect(decideRedirect('/profile', true, 'admin')).toBe('/admin')
  })
  it('обычного пользователя на /profile пускает', () => {
    expect(decideRedirect('/profile', true, 'user')).toBeNull()
  })
})
