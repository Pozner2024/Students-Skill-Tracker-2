import { API_CONFIG } from './config'
import { http } from './http'
import { getToken, removeToken } from './tokenStorage'
import { isAuthError } from './errors'
import type {
  CurrentUserResult,
  TestResult,
  TestResultsResult,
  UpdateProfileResult,
  User,
} from './types'

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

export async function updateProfile(
  fullName: string,
  groupNumber: string,
): Promise<UpdateProfileResult> {
  const token = getToken()
  if (!token) return { success: false, error: 'Пользователь не авторизован' }
  try {
    const data = await http.put<User>(
      API_CONFIG.ENDPOINTS.USERS.PROFILE,
      { fullName, groupNumber },
      { context: 'users.updateProfile' },
    )
    return { success: true, user: data }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, error: (error as Error).message }
  }
}

export async function getTestResults(): Promise<TestResultsResult> {
  const token = getToken()
  if (!token) return { success: false, results: [], error: 'Пользователь не авторизован' }
  try {
    const data = await http.get<{ results?: TestResult[] }>(
      API_CONFIG.ENDPOINTS.TEST_RESULTS.GET,
      { context: 'users.getTestResults' },
    )
    return { success: true, results: data.results || [] }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, results: [], error: (error as Error).message }
  }
}
