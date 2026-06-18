import { API_CONFIG } from './config'
import { http } from './http'
import { setToken } from './tokenStorage'
import type { AuthResult, User } from './types'

interface AuthResponse {
  access_token?: string
  accessToken?: string
  token?: string
  user?: User
  data?: AuthResponse
}

function extractToken(data: AuthResponse): string | null {
  return (
    data?.access_token ||
    data?.accessToken ||
    data?.token ||
    data?.data?.access_token ||
    data?.data?.accessToken ||
    data?.data?.token ||
    null
  )
}

function extractUser(data: AuthResponse): User | null {
  return data?.user || data?.data?.user || null
}

export async function register(email: string, password: string): Promise<AuthResult> {
  try {
    const data = await http.publicRequest<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: { email, password },
      context: 'auth.register',
    })
    const token = extractToken(data)
    setToken(token)
    return { success: true, user: extractUser(data), token }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const data = await http.publicRequest<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: { email, password },
      context: 'auth.login',
    })
    const token = extractToken(data)
    if (!token) throw new Error('Токен авторизации не получен')
    setToken(token)
    return { success: true, user: extractUser(data), token }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
