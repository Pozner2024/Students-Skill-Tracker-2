import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import { getCurrentUser } from '@/api/users'
import { getToken, removeToken } from '@/api/tokenStorage'
import type { AuthResult, User } from '@/api/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(getToken())

  const isAuthenticated = computed(
    () => !!token.value && token.value !== 'undefined' && token.value !== 'null',
  )

  async function login(email: string, password: string): Promise<AuthResult> {
    const result = await authApi.login(email, password)
    if (result.success) {
      token.value = result.token ?? getToken()
      user.value = result.user ?? null
    }
    return result
  }

  async function register(email: string, password: string): Promise<AuthResult> {
    const result = await authApi.register(email, password)
    if (result.success) {
      token.value = result.token ?? getToken()
      user.value = result.user ?? null
    }
    return result
  }

  async function fetchCurrentUser(): Promise<void> {
    const result = await getCurrentUser()
    if (result.success && result.user) {
      user.value = result.user
    } else {
      user.value = null
      token.value = getToken()
    }
  }

  function logout(): void {
    removeToken()
    user.value = null
    token.value = null
  }

  return { user, token, isAuthenticated, login, register, fetchCurrentUser, logout }
})
