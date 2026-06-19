import { API_CONFIG } from './config'
import { http } from './http'
import { getToken, removeToken } from './tokenStorage'
import { isAuthError } from './errors'
import type {
  CurrentUserResult,
  DeleteResult,
  DownloadUrlResult,
  FilesResult,
  TestResult,
  TestResultsResult,
  UpdateProfileResult,
  UploadResult,
  User,
  UserFile,
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

export async function getUserFiles(): Promise<FilesResult> {
  const token = getToken()
  if (!token) return { success: false, files: [], error: 'Пользователь не авторизован' }
  try {
    const data = await http.get<{ files?: UserFile[]; success?: boolean }>(
      API_CONFIG.ENDPOINTS.UPLOAD.FILES,
      { context: 'users.getUserFiles' },
    )
    if (data && data.success !== false) {
      return { success: true, files: data.files || [] }
    }
    return { success: false, files: [], error: 'Ошибка при получении списка файлов' }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, files: [], error: (error as Error).message }
  }
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const token = getToken()
  if (!token) return { success: false, error: 'Пользователь не авторизован' }
  try {
    const formData = new FormData()
    formData.append('file', file)
    const data = await http.uploadFile<{ success?: boolean; data?: unknown; message?: string }>(
      API_CONFIG.ENDPOINTS.UPLOAD.UPLOAD,
      formData,
      { context: 'users.uploadFile' },
    )
    if (data && data.success !== false) {
      return { success: true, data: data.data ?? data }
    }
    return { success: false, error: data?.message || 'Ошибка при загрузке файла' }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteFile(key: string): Promise<DeleteResult> {
  const token = getToken()
  if (!token) return { success: false, error: 'Пользователь не авторизован' }
  try {
    const endpoint = `${API_CONFIG.ENDPOINTS.UPLOAD.DELETE}/${encodeURIComponent(key)}`
    const data = await http.delete<{ message?: string }>(endpoint, { context: 'users.deleteFile' })
    return { success: true, message: data.message }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, error: (error as Error).message }
  }
}

export async function getDownloadUrl(key: string): Promise<DownloadUrlResult> {
  const token = getToken()
  if (!token) return { success: false, error: 'Пользователь не авторизован' }
  try {
    const endpoint = `${API_CONFIG.ENDPOINTS.UPLOAD.DOWNLOAD}/${encodeURIComponent(key)}`
    const data = await http.get<{ url?: string }>(endpoint, { context: 'users.getDownloadUrl' })
    return { success: true, url: data.url }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, error: (error as Error).message }
  }
}
