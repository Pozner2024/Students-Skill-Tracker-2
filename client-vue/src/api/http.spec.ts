import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { http } from './http'
import { setToken } from './tokenStorage'

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

describe('http', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('GET парсит JSON-ответ', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ hello: 'world' }))
    const data = await http.get<{ hello: string }>('/ping')
    expect(data.hello).toBe('world')
  })

  it('добавляет Authorization при наличии токена', async () => {
    setToken('tok123')
    const fetchMock = mockFetchJson({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await http.get('/secure')
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok123')
  })

  it('бросает ошибку с message из тела при !ok', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ message: 'Плохо' }, false, 400))
    await expect(http.get('/bad')).rejects.toThrow('Плохо')
  })
})
