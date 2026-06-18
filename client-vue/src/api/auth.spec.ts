import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { login } from './auth'
import { getToken } from './tokenStorage'

function mockFetchJson(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: { get: () => 'application/json' },
    clone() {
      return this
    },
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(body)).buffer,
  })
}

describe('login', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('при успехе сохраняет токен и возвращает success', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ access_token: 'tok', user: { id: 1, email: 'a@b.c' } }))
    const res = await login('a@b.c', 'pw')
    expect(res.success).toBe(true)
    expect(res.token).toBe('tok')
    expect(getToken()).toBe('tok')
  })

  it('при отсутствии токена возвращает success: false', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ user: { id: 1 } }))
    const res = await login('a@b.c', 'pw')
    expect(res.success).toBe(false)
  })
})
