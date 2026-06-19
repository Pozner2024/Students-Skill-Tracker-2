import { describe, it, expect, afterEach, vi } from 'vitest'
import { getTopic } from './topics'

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

describe('getTopic', () => {
  it('возвращает тему при success', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ success: true, topic: { id: 1, name: 'Тема' } }))
    const res = await getTopic(1)
    expect(res.success).toBe(true)
    expect(res.topic?.name).toBe('Тема')
  })

  it('возвращает success: false при ошибке', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ success: false }))
    const res = await getTopic(99)
    expect(res.success).toBe(false)
    expect(res.topic).toBeNull()
  })
})
