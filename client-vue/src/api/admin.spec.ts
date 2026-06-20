import { describe, it, expect, afterEach, vi } from 'vitest'
import { getGroupedResults } from './admin'

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

describe('getGroupedResults', () => {
  it('возвращает groups/noGroup при успехе', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => 'token',
      setItem: () => {},
      removeItem: () => {},
    })
    vi.stubGlobal(
      'fetch',
      mockFetchJson({ groups: [{ groupNumber: '1', students: [] }], noGroup: [] }),
    )
    const res = await getGroupedResults()
    expect(res.success).toBe(true)
    expect(res.data.groups).toHaveLength(1)
    expect(res.data.noGroup).toEqual([])
  })
})
