import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getTestResults, getUserFiles } from './users'
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

describe('getTestResults', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('без токена возвращает success: false и пустой список', async () => {
    const res = await getTestResults()
    expect(res.success).toBe(false)
    expect(res.results).toEqual([])
  })

  it('с токеном возвращает список результатов', async () => {
    setToken('tok')
    vi.stubGlobal('fetch', mockFetchJson({ results: [{ completed_at: '2026-01-01', grade: 9 }] }))
    const res = await getTestResults()
    expect(res.success).toBe(true)
    expect(res.results).toHaveLength(1)
  })
})

describe('getUserFiles', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('без токена — success: false, пустой список', async () => {
    const res = await getUserFiles()
    expect(res.success).toBe(false)
    expect(res.files).toEqual([])
  })

  it('с токеном возвращает файлы', async () => {
    setToken('tok')
    vi.stubGlobal(
      'fetch',
      mockFetchJson({
        files: [{ key: 'k', fileName: 'a.pdf', size: 10, lastModified: '2026-01-01' }],
      }),
    )
    const res = await getUserFiles()
    expect(res.success).toBe(true)
    expect(res.files[0].fileName).toBe('a.pdf')
  })
})
