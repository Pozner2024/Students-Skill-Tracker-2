import { API_CONFIG } from './config'
import { getToken } from './tokenStorage'

export interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  params?: Record<string, string | number | null | undefined>
  includeAuth?: boolean
  context?: string
  timeout?: number
}

const DEFAULT_TIMEOUT = 30000

async function readResponseText(response: Response): Promise<string> {
  const buffer = await response.arrayBuffer()
  return new TextDecoder('utf-8').decode(buffer)
}

function buildHeaders(
  custom: Record<string, string>,
  includeAuth: boolean,
  body: unknown,
): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (includeAuth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  if (body instanceof FormData) {
    delete headers['Content-Type']
  }
  return { ...headers, ...custom }
}

function buildURL(endpoint: string, params: RequestOptions['params']): string {
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) url.searchParams.append(key, String(value))
    })
  }
  return url.toString()
}

async function parseError(response: Response): Promise<string> {
  let message = `HTTP ${response.status}: ${response.statusText}`
  try {
    const text = await readResponseText(response.clone())
    if (text.trim().startsWith('------') || text.includes('multipart/form-data')) {
      return 'Ошибка сервера: получен неверный формат ответа (multipart вместо JSON).'
    }
    try {
      const data = JSON.parse(text) as { message?: string; error?: string }
      message = data.message || data.error || message
    } catch {
      if (text) message = text.substring(0, 200)
    }
  } catch {
    /* оставляем дефолтное сообщение */
  }
  return message
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  const contentType = response.headers.get('content-type') || ''
  const text = await readResponseText(response)
  if (text.trim().startsWith('------') || contentType.includes('multipart/')) {
    throw new Error('Сервер вернул неожиданный формат ответа. Ожидался JSON, получен multipart.')
  }
  if (contentType.includes('application/json') || !contentType) {
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error(`Неверный формат ответа сервера: ${text.substring(0, 100)}`)
    }
  }
  return text as unknown as T
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body = null,
    headers: customHeaders = {},
    params,
    includeAuth = true,
    timeout = DEFAULT_TIMEOUT,
  } = options

  const url = buildURL(endpoint, params)
  let requestBody: BodyInit | undefined
  if (body instanceof FormData) requestBody = body
  else if (body && typeof body === 'object') requestBody = JSON.stringify(body)
  else if (typeof body === 'string') requestBody = body

  const headers = buildHeaders(customHeaders, includeAuth, body)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return await handleResponse<T>(response)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Превышено время ожидания ответа (${timeout}ms)`)
    }
    throw error
  }
}

export const http = {
  request,
  get: <T>(endpoint: string, options: RequestOptions = {}) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: unknown = null, options: RequestOptions = {}) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body: unknown = null, options: RequestOptions = {}) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),
  patch: <T>(endpoint: string, body: unknown = null, options: RequestOptions = {}) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T>(endpoint: string, options: RequestOptions = {}) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
  uploadFile: <T>(endpoint: string, formData: FormData, options: RequestOptions = {}) =>
    request<T>(endpoint, { ...options, method: 'POST', body: formData }),
  publicRequest: <T>(endpoint: string, options: RequestOptions = {}) =>
    request<T>(endpoint, { ...options, includeAuth: false }),
}
