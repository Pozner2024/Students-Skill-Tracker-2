import { API_CONFIG } from './config'
import { http } from './http'
import { getToken, removeToken } from './tokenStorage'
import { isAuthError } from './errors'
import type {
  DeleteResult,
  DownloadUrlResult,
  FilesResult,
  GroupedResults,
  GroupedResultsResult,
  UserFile,
} from './types'

export async function getGroupedResults(): Promise<GroupedResultsResult> {
  const token = getToken()
  const empty: GroupedResults = { groups: [], noGroup: [] }
  if (!token) return { success: false, data: empty, error: 'Пользователь не авторизован' }
  try {
    const data = await http.get<GroupedResults>(API_CONFIG.ENDPOINTS.ADMIN.RESULTS, {
      context: 'admin.getGroupedResults',
    })
    return {
      success: true,
      data: { groups: data.groups || [], noGroup: data.noGroup || [] },
    }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, data: empty, error: (error as Error).message }
  }
}

export async function getStudentFiles(studentId: number | string): Promise<FilesResult> {
  const token = getToken()
  if (!token) return { success: false, files: [], error: 'Пользователь не авторизован' }
  try {
    const data = await http.get<{ files?: UserFile[] }>(
      `${API_CONFIG.ENDPOINTS.ADMIN.STUDENT_FILES}/${studentId}/files`,
      { context: 'admin.getStudentFiles' },
    )
    return { success: true, files: data.files || [] }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, files: [], error: (error as Error).message }
  }
}

export async function deleteStudentFile(key: string): Promise<DeleteResult> {
  const token = getToken()
  if (!token) return { success: false, error: 'Пользователь не авторизован' }
  try {
    const endpoint = `${API_CONFIG.ENDPOINTS.ADMIN.FILES}/${encodeURIComponent(key)}`
    const data = await http.delete<{ message?: string }>(endpoint, {
      context: 'admin.deleteStudentFile',
    })
    return { success: true, message: data.message }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, error: (error as Error).message }
  }
}

export async function getStudentFileDownloadUrl(key: string): Promise<DownloadUrlResult> {
  const token = getToken()
  if (!token) return { success: false, error: 'Пользователь не авторизован' }
  try {
    const endpoint = `${API_CONFIG.ENDPOINTS.ADMIN.FILES}/${encodeURIComponent(key)}/download`
    const data = await http.get<{ url?: string }>(endpoint, {
      context: 'admin.getStudentFileDownloadUrl',
    })
    return { success: true, url: data.url }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteUser(userId: number | string): Promise<DeleteResult> {
  const token = getToken()
  if (!token) return { success: false, error: 'Пользователь не авторизован' }
  try {
    const data = await http.delete<{ message?: string }>(
      `${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}`,
      { context: 'admin.deleteUser' },
    )
    return { success: true, message: data.message || 'Пользователь успешно удален' }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, error: (error as Error).message }
  }
}
