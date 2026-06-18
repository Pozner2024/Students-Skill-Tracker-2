import { API_CONFIG } from './config'
import { http } from './http'
import { getToken, removeToken } from './tokenStorage'
import { isAuthError } from './errors'
import type { CurrentUserResult, User } from './types'

export async function getCurrentUser(): Promise<CurrentUserResult> {
  const token = getToken()
  if (!token) return { success: false, error: 'Пользователь не авторизован' }
  try {
    const data = await http.get<User>(API_CONFIG.ENDPOINTS.USERS.PROFILE, {
      context: 'users.getCurrentUser',
    })
    return { success: true, user: data }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, error: (error as Error).message }
  }
}
