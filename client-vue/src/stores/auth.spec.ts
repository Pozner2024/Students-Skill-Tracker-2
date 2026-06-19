import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'
import * as authApi from '@/api/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  afterEach(() => vi.restoreAllMocks())

  it('login при успехе ставит user и token', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      success: true,
      token: 'tok',
      user: { id: 1, email: 'a@b.c' },
    })
    const store = useAuthStore()
    const res = await store.login('a@b.c', 'pw')
    expect(res.success).toBe(true)
    expect(store.token).toBe('tok')
    expect(store.isAuthenticated).toBe(true)
    expect(store.user?.email).toBe('a@b.c')
  })

  it('logout очищает состояние', () => {
    const store = useAuthStore()
    store.$patch({ user: { id: 1, email: 'a@b.c' }, token: 'tok' })
    store.logout()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})
