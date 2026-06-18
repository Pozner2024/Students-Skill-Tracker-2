# Этап 1: Фундамент client-vue (API, auth, роутинг, layout) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести в `client-vue` типизированный API-слой, Pinia-стор авторизации, Vue Router с guards и каркас приложения с layout (Header, Menu/бургер, Footer, Loader) — поведение как в старом клиенте.

**Architecture:** `src/api/*` — типизированная замена `services/*` (fetch-обёртка, эндпоинты, ошибки, хранение токена, auth/users-запросы). `src/stores/*` — Pinia (auth, ui). `src/router/*` — таблица маршрутов + чистая функция-решатель редиректов (бывшие middleware) в `beforeEach`. `src/components/layout/*` + `App.vue` — каркас. Тесты — Vitest (юнит) для логики API/стора/guards.

**Tech Stack:** Vue 3 `<script setup>` + TS, Vue Router 4, Pinia 3, Vitest + @vue/test-utils + jsdom, Bootstrap 5.

## Global Constraints

- Весь код — в `client-vue/`. `client/` и `server/` НЕ менять.
- TypeScript, Composition API. Имена компонентов — многословные (правило `vue/multi-word-component-names`): `AppHeader`, `AppMenu`, `AppFooter`, `AppLoader`, `PlaceholderView`.
- API сервера — под префиксом `/api` (dev-proxy уже настроен), токен в `localStorage` под ключом `auth_token`.
- Ветка `feat/vue-rewrite`, коммиты только локально, на GitHub НЕ пушим.
- Команды — из `client-vue/`. После каждой задачи: `npm run build` и `npm run test:unit` зелёные.
- Точная копия поведения 1-в-1. НЕ переносим в этом этапе: визуальные уведомления-тосты (`showNotification`), файловые/админ-методы userService, страничный контент (только заглушки) — это следующие этапы.

## Перенос поведения (соответствие старому коду)

| Старое (`client/src/...`) | Новое (`client-vue/src/...`) |
|---|---|
| `config/api.js` (`API_CONFIG`) | `api/config.ts` |
| `services/errorHandler.js` (getErrorMessage/isAuthError) | `api/errors.ts` (без DOM-уведомлений) |
| `services/authCore.js` (токен, валидация) | `api/tokenStorage.ts` + `stores/auth.ts` |
| `services/apiClient.js` | `api/http.ts` |
| `services/authApi.js` | `api/auth.ts` |
| `services/userService.js` (getCurrentUser) | `api/users.ts` (только getCurrentUser в этом этапе) |
| `router/index.js` + `routerConfig.js` middleware | `router/guards.ts` (`decideRedirect`) + `router/index.ts` (`beforeEach`) |
| `components/layout/*.js` + `*.css` | `components/layout/App*.vue` + перенесённый CSS |
| `common/base.css` (токены) | `assets/base.css` |

> `specialRouteMiddleware` (тест без параметров → «Выберите тест») переносится на Этапе 5 вместе со страницей TestPage — там его логичное место.

---

## Структура файлов (создаётся в этом этапе)

```
client-vue/
├─ vite.config.ts                 (+ блок test для Vitest)
├─ src/
│  ├─ api/
│  │  ├─ config.ts                API_CONFIG (эндпоинты)
│  │  ├─ types.ts                 User, AuthResult и пр.
│  │  ├─ errors.ts                ERROR_MESSAGES, getErrorMessage, isAuthError
│  │  ├─ tokenStorage.ts          get/set/removeToken, hasValidToken
│  │  ├─ http.ts                  fetch-обёртка (get/post/put/patch/delete/uploadFile/publicRequest)
│  │  ├─ auth.ts                  login, register
│  │  └─ users.ts                 getCurrentUser
│  ├─ stores/
│  │  ├─ auth.ts                  (наполняем) user/token/isAuthenticated + login/register/logout/fetchCurrentUser
│  │  └─ ui.ts                    isLoading (для лоадера)
│  ├─ router/
│  │  ├─ guards.ts                PUBLIC_ROUTES, decideRedirect
│  │  └─ index.ts                 (наполняем) полная таблица маршрутов + beforeEach
│  ├─ components/layout/
│  │  ├─ AppHeader.vue
│  │  ├─ AppMenu.vue
│  │  ├─ AppFooter.vue
│  │  └─ AppLoader.vue
│  ├─ views/
│  │  └─ PlaceholderView.vue      заглушка для ещё не перенесённых страниц
│  ├─ assets/
│  │  ├─ base.css                 (заменяем) дизайн-токены + глобальные стили
│  │  ├─ logo_vgik.png            (копируем из client/)
│  │  └─ layout/
│  │     ├─ header.css            (копия client/.../Header.css)
│  │     ├─ menu.css              (копия client/.../Menu.css)
│  │     ├─ footer.css            (копия client/.../Footer.css)
│  │     ├─ bootstrap-overrides.css (копия client/.../bootstrap-overrides.css)
│  │     └─ cube-loader.css       (копия client/.../CubeLoader.css)
│  └─ tests/                      *.spec.ts рядом с модулями допустимо; здесь — общие
└─ ...
```

---

## Task 1: Тестовый харнесс Vitest

**Files:**
- Modify: `client-vue/vite.config.ts`
- Modify: `client-vue/package.json` (devDeps + скрипты)
- Create: `client-vue/src/api/smoke.spec.ts`

**Interfaces:**
- Produces: команды `npm run test:unit` (однократно) и `npm run test:unit:watch`.

- [ ] **Step 1: Установить Vitest и утилиты**

```bash
cd client-vue && npm install -D vitest @vue/test-utils jsdom
```

- [ ] **Step 2: Добавить блок `test` в `client-vue/vite.config.ts`**

В начало файла добавить строку-ссылку на типы, и в объект конфигурации добавить поле `test`:
```ts
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 3: Добавить скрипты в `client-vue/package.json`**

В блок `"scripts"` добавить:
```json
"test:unit": "vitest run",
"test:unit:watch": "vitest"
```

- [ ] **Step 4: Написать smoke-тест `client-vue/src/api/smoke.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'

describe('vitest harness', () => {
  it('работает', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Запустить тесты — должны пройти**

```bash
cd client-vue && npm run test:unit
```
Ожидаемо: 1 passed.

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "test: подключить Vitest в client-vue"
```

---

## Task 2: Конфиг эндпоинтов и типы

**Files:**
- Create: `client-vue/src/api/config.ts`
- Create: `client-vue/src/api/types.ts`

**Interfaces:**
- Produces:
  - `API_CONFIG` с `BASE_URL` и `ENDPOINTS` (как в старом `config/api.js`).
  - `interface User`, `interface AuthResult`, `interface CurrentUserResult`.

- [ ] **Step 1: Создать `client-vue/src/api/config.ts`**

```ts
// Конфиг API. BASE_URL = '/api' (dev-proxy и nginx проксируют на сервер).
export const API_CONFIG = {
  BASE_URL: '/api',
  ENDPOINTS: {
    TESTS: '/tests',
    TEST_BY_CODE: '/tests/test',
    TEST_WITH_IMAGES: '/tests/test-with-images',
    TEST_BY_ID: '/tests',
    IMAGES: '/images',
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login',
    },
    USERS: {
      PROFILE: '/users/profile',
    },
    TEST_RESULTS: {
      GET: '/test-results',
      SAVE: '/test-results',
    },
    TOPICS: '/topics',
    TOPIC_CONTENT: '/topics',
    UPLOAD: {
      UPLOAD: '/upload',
      FILES: '/upload/files',
      DELETE: '/upload/delete',
      DOWNLOAD: '/upload/download',
    },
  },
} as const
```

- [ ] **Step 2: Создать `client-vue/src/api/types.ts`**

```ts
export interface User {
  id: number | string
  email: string
  role?: string
  fullName?: string
  groupNumber?: string
  [key: string]: unknown
}

export interface AuthResult {
  success: boolean
  user?: User | null
  token?: string | null
  error?: string
}

export interface CurrentUserResult {
  success: boolean
  user?: User
  error?: string
}
```

- [ ] **Step 3: Проверить сборку**

```bash
cd client-vue && npm run build
```
Ожидаемо: без ошибок.

- [ ] **Step 4: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: api/config и типы в client-vue"
```

---

## Task 3: Обработка ошибок (TDD)

**Files:**
- Create: `client-vue/src/api/errors.ts`
- Create: `client-vue/src/api/errors.spec.ts`

**Interfaces:**
- Produces:
  - `getErrorMessage(error: unknown, context?: string): string`
  - `isAuthError(error: unknown): boolean`
  - `ERROR_MESSAGES` (объект сообщений).

- [ ] **Step 1: Написать падающий тест `client-vue/src/api/errors.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { getErrorMessage, isAuthError } from './errors'

describe('isAuthError', () => {
  it('ловит 401/unauthorized/токен', () => {
    expect(isAuthError(new Error('Unauthorized'))).toBe(true)
    expect(isAuthError(new Error('HTTP 401'))).toBe(true)
    expect(isAuthError(new Error('Неверный токен'))).toBe(true)
    expect(isAuthError(new Error('что-то другое'))).toBe(false)
  })
})

describe('getErrorMessage', () => {
  it('возвращает строку как есть', () => {
    expect(getErrorMessage('Ошибка входа')).toBe('Ошибка входа')
  })
  it('для timeout даёт сообщение о времени ожидания', () => {
    expect(getErrorMessage(new Error('timeout 30000ms'))).toMatch(/время ожидания/i)
  })
})
```

- [ ] **Step 2: Запустить — тест падает (модуль не найден)**

```bash
cd client-vue && npm run test:unit -- errors
```
Ожидаемо: FAIL (Cannot find module './errors').

- [ ] **Step 3: Создать `client-vue/src/api/errors.ts`**

```ts
export const ERROR_MESSAGES = {
  network: 'Проблема с подключением к серверу. Проверьте интернет-соединение.',
  timeout: 'Превышено время ожидания ответа от сервера.',
  fetch: 'Ошибка при выполнении запроса к серверу.',
  unauthorized: 'Вы не авторизованы. Пожалуйста, войдите в систему.',
  forbidden: 'У вас нет доступа к этому ресурсу.',
  tokenExpired: 'Ваша сессия истекла. Пожалуйста, войдите снова.',
  validation: 'Проверьте правильность введенных данных.',
  server: 'Ошибка на сервере. Попробуйте позже.',
  notFound: 'Запрашиваемый ресурс не найден.',
  conflict: 'Конфликт данных. Возможно, запись уже существует.',
  unknown: 'Произошла неизвестная ошибка. Попробуйте еще раз.',
} as const

export function isAuthError(error: unknown): boolean {
  const raw =
    typeof error === 'string'
      ? error
      : ((error as { message?: string; error?: string })?.message ??
        (error as { error?: string })?.error ??
        '')
  const message = String(raw).toLowerCase()
  return (
    message.includes('unauthorized') ||
    message.includes('401') ||
    message.includes('токен') ||
    message.includes('сессия') ||
    message.includes('авторизац')
  )
}

export function getErrorMessage(error: unknown, context = ''): string {
  if (typeof error === 'string') return error

  if (error && typeof error === 'object') {
    const obj = error as { error?: unknown; message?: string; success?: boolean }
    if (obj.error) return getErrorMessage(obj.error, context)
    if (obj.success === false) return obj.message || ERROR_MESSAGES.unknown
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch'))
      return ERROR_MESSAGES.network
    if (message.includes('timeout') || message.includes('время ожидания'))
      return ERROR_MESSAGES.timeout
    if (message.includes('unauthorized') || message.includes('401') || message.includes('токен') || message.includes('сессия'))
      return ERROR_MESSAGES.tokenExpired
    if (message.includes('forbidden') || message.includes('403') || message.includes('доступ'))
      return ERROR_MESSAGES.forbidden
    if (message.includes('500') || message.includes('internal server error'))
      return ERROR_MESSAGES.server
    if (message.includes('404') || message.includes('not found') || message.includes('не найден'))
      return ERROR_MESSAGES.notFound
    if (message.includes('409') || message.includes('conflict') || message.includes('конфликт'))
      return ERROR_MESSAGES.conflict
    if (error.message && error.message.length < 200) return error.message
  }

  return context ? `${ERROR_MESSAGES.unknown} (${context})` : ERROR_MESSAGES.unknown
}
```

- [ ] **Step 4: Запустить тесты — проходят**

```bash
cd client-vue && npm run test:unit -- errors
```
Ожидаемо: PASS.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: api/errors (getErrorMessage, isAuthError) с тестами"
```

---

## Task 4: Хранение токена (TDD)

**Files:**
- Create: `client-vue/src/api/tokenStorage.ts`
- Create: `client-vue/src/api/tokenStorage.spec.ts`

**Interfaces:**
- Produces:
  - `getToken(): string | null`
  - `setToken(token: string | null | undefined): void`
  - `removeToken(): void`
  - `hasValidToken(): boolean`
  - Константа ключа: `'auth_token'`.

- [ ] **Step 1: Написать падающий тест `client-vue/src/api/tokenStorage.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, removeToken, hasValidToken } from './tokenStorage'

describe('tokenStorage', () => {
  beforeEach(() => localStorage.clear())

  it('сохраняет и читает токен', () => {
    setToken('abc')
    expect(getToken()).toBe('abc')
    expect(hasValidToken()).toBe(true)
  })

  it('строку "undefined" считает невалидной и удаляет', () => {
    setToken('undefined')
    expect(getToken()).toBeNull()
    expect(hasValidToken()).toBe(false)
  })

  it('removeToken очищает', () => {
    setToken('abc')
    removeToken()
    expect(getToken()).toBeNull()
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- tokenStorage
```
Ожидаемо: FAIL (модуль не найден).

- [ ] **Step 3: Создать `client-vue/src/api/tokenStorage.ts`**

```ts
const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null | undefined): void {
  if (!token || token === 'undefined' || token === 'null') {
    removeToken()
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function hasValidToken(): boolean {
  const token = getToken()
  return !!token && token !== 'undefined' && token !== 'null'
}
```

- [ ] **Step 4: Запустить — проходят**

```bash
cd client-vue && npm run test:unit -- tokenStorage
```
Ожидаемо: PASS.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: api/tokenStorage с тестами"
```

---

## Task 5: HTTP-клиент (TDD)

**Files:**
- Create: `client-vue/src/api/http.ts`
- Create: `client-vue/src/api/http.spec.ts`

**Interfaces:**
- Consumes: `API_CONFIG` (Task 2), `getToken` (Task 4).
- Produces: объект `http` с методами:
  - `request<T>(endpoint: string, options?: RequestOptions): Promise<T>`
  - `get<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>`, `uploadFile<T>`, `publicRequest<T>`
  - `interface RequestOptions { method?; body?; headers?; params?; includeAuth?; context?; timeout? }`

- [ ] **Step 1: Написать падающий тест `client-vue/src/api/http.spec.ts`**

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { http } from './http'
import { setToken } from './tokenStorage'

function mockFetchJson(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: { get: () => 'application/json' },
    clone() {
      return this
    },
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(body)).buffer,
  })
}

describe('http', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('GET парсит JSON-ответ', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ hello: 'world' }))
    const data = await http.get<{ hello: string }>('/ping')
    expect(data.hello).toBe('world')
  })

  it('добавляет Authorization при наличии токена', async () => {
    setToken('tok123')
    const fetchMock = mockFetchJson({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await http.get('/secure')
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok123')
  })

  it('бросает ошибку с message из тела при !ok', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ message: 'Плохо' }, false, 400))
    await expect(http.get('/bad')).rejects.toThrow('Плохо')
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- http
```
Ожидаемо: FAIL (модуль не найден).

- [ ] **Step 3: Создать `client-vue/src/api/http.ts`**

```ts
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

function buildHeaders(custom: Record<string, string>, includeAuth: boolean, body: unknown): Record<string, string> {
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
    const response = await fetch(url, { method, headers, body: requestBody, signal: controller.signal })
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
  get: <T>(endpoint: string, options: RequestOptions = {}) => request<T>(endpoint, { ...options, method: 'GET' }),
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
```

- [ ] **Step 4: Запустить тесты — проходят**

```bash
cd client-vue && npm run test:unit -- http
```
Ожидаемо: PASS (3 теста).

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: api/http (fetch-обёртка) с тестами"
```

---

## Task 6: Запросы auth и users (TDD)

**Files:**
- Create: `client-vue/src/api/auth.ts`
- Create: `client-vue/src/api/users.ts`
- Create: `client-vue/src/api/auth.spec.ts`

**Interfaces:**
- Consumes: `http` (Task 5), `setToken/getToken/removeToken` (Task 4), `isAuthError` (Task 3), типы (Task 2).
- Produces:
  - `login(email: string, password: string): Promise<AuthResult>`
  - `register(email: string, password: string): Promise<AuthResult>`
  - `getCurrentUser(): Promise<CurrentUserResult>`

- [ ] **Step 1: Написать падающий тест `client-vue/src/api/auth.spec.ts`**

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { login } from './auth'
import { getToken } from './tokenStorage'

function mockFetchJson(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: { get: () => 'application/json' },
    clone() {
      return this
    },
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(body)).buffer,
  })
}

describe('login', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('при успехе сохраняет токен и возвращает success', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ access_token: 'tok', user: { id: 1, email: 'a@b.c' } }))
    const res = await login('a@b.c', 'pw')
    expect(res.success).toBe(true)
    expect(res.token).toBe('tok')
    expect(getToken()).toBe('tok')
  })

  it('при отсутствии токена возвращает success: false', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ user: { id: 1 } }))
    const res = await login('a@b.c', 'pw')
    expect(res.success).toBe(false)
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- auth
```
Ожидаемо: FAIL (модуль не найден).

- [ ] **Step 3: Создать `client-vue/src/api/auth.ts`**

```ts
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
```

- [ ] **Step 4: Создать `client-vue/src/api/users.ts`**

```ts
import { API_CONFIG } from './config'
import { http } from './http'
import { getToken, removeToken } from './tokenStorage'
import { isAuthError } from './errors'
import type { CurrentUserResult, User } from './types'

export async function getCurrentUser(): Promise<CurrentUserResult> {
  const token = getToken()
  if (!token) return { success: false, error: 'Пользователь не авторизован' }
  try {
    const data = await http.get<User>(API_CONFIG.ENDPOINTS.USERS.PROFILE, { context: 'users.getCurrentUser' })
    return { success: true, user: data }
  } catch (error) {
    if (isAuthError(error)) removeToken()
    return { success: false, error: (error as Error).message }
  }
}
```

- [ ] **Step 5: Запустить тесты — проходят**

```bash
cd client-vue && npm run test:unit -- auth
```
Ожидаемо: PASS.

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: api/auth и api/users (getCurrentUser) с тестами"
```

---

## Task 7: Pinia-стор авторизации (TDD)

**Files:**
- Modify: `client-vue/src/stores/auth.ts` (заменяем заглушку)
- Create: `client-vue/src/stores/auth.spec.ts`
- Create: `client-vue/src/stores/ui.ts`

**Interfaces:**
- Consumes: `api/auth`, `api/users`, `api/tokenStorage`, типы.
- Produces:
  - `useAuthStore` со state `user: User | null`, `token: string | null`; геттер `isAuthenticated: boolean`; действия:
    - `login(email, password): Promise<AuthResult>`
    - `register(email, password): Promise<AuthResult>`
    - `fetchCurrentUser(): Promise<void>`
    - `logout(): void`
  - `useUiStore` со state `isLoading: boolean` и действиями `showLoader()` / `hideLoader()`.

- [ ] **Step 1: Написать падающий тест `client-vue/src/stores/auth.spec.ts`**

```ts
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
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- stores/auth
```
Ожидаемо: FAIL (нет действий login/logout).

- [ ] **Step 3: Заменить содержимое `client-vue/src/stores/auth.ts`**

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import { getCurrentUser } from '@/api/users'
import { getToken, removeToken, hasValidToken } from '@/api/tokenStorage'
import type { AuthResult, User } from '@/api/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(getToken())

  const isAuthenticated = computed(() => hasValidToken())

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
```

- [ ] **Step 4: Создать `client-vue/src/stores/ui.ts`**

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isLoading = ref(false)
  function showLoader(): void {
    isLoading.value = true
  }
  function hideLoader(): void {
    isLoading.value = false
  }
  return { isLoading, showLoader, hideLoader }
})
```

- [ ] **Step 5: Запустить тесты — проходят**

```bash
cd client-vue && npm run test:unit -- stores/auth
```
Ожидаемо: PASS.

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: Pinia auth/ui сторы с тестами"
```

---

## Task 8: Guards роутера (TDD)

**Files:**
- Create: `client-vue/src/router/guards.ts`
- Create: `client-vue/src/router/guards.spec.ts`

**Interfaces:**
- Produces:
  - `PUBLIC_ROUTES: string[]` (`['/login', '/about', '/contacts']`)
  - `decideRedirect(path: string, isAuthenticated: boolean, userRole?: string): string | null`

- [ ] **Step 1: Написать падающий тест `client-vue/src/router/guards.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { decideRedirect } from './guards'

describe('decideRedirect', () => {
  it('неавторизованного с приватной страницы шлёт на /login', () => {
    expect(decideRedirect('/profile', false)).toBe('/login')
  })
  it('неавторизованного на публичную пускает', () => {
    expect(decideRedirect('/about', false)).toBeNull()
  })
  it('авторизованного с /login шлёт на /', () => {
    expect(decideRedirect('/login', true)).toBe('/')
  })
  it('админа с /profile шлёт на /admin', () => {
    expect(decideRedirect('/profile', true, 'admin')).toBe('/admin')
  })
  it('обычного пользователя на /profile пускает', () => {
    expect(decideRedirect('/profile', true, 'user')).toBeNull()
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- guards
```
Ожидаемо: FAIL (модуль не найден).

- [ ] **Step 3: Создать `client-vue/src/router/guards.ts`**

```ts
// Чистая логика редиректов — перенос middleware из старого routerConfig.js.
export const PUBLIC_ROUTES = ['/login', '/about', '/contacts']

export function decideRedirect(
  path: string,
  isAuthenticated: boolean,
  userRole?: string,
): string | null {
  if (!isAuthenticated && !PUBLIC_ROUTES.includes(path)) return '/login'
  if (isAuthenticated && path === '/login') return '/'
  if (path === '/profile' && userRole === 'admin') return '/admin'
  return null
}
```

- [ ] **Step 4: Запустить тесты — проходят**

```bash
cd client-vue && npm run test:unit -- guards
```
Ожидаемо: PASS (5 тестов).

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: router/guards (decideRedirect) с тестами"
```

---

## Task 9: Таблица маршрутов + заглушка-страница + beforeEach

**Files:**
- Create: `client-vue/src/views/PlaceholderView.vue`
- Modify: `client-vue/src/router/index.ts`

**Interfaces:**
- Consumes: `decideRedirect` (Task 8), `useAuthStore` (Task 7), `HomeView`/`NotFoundView` (Этап 0), `PlaceholderView`.
- Produces: маршруты `/`, `/about`, `/contacts`, `/criteria`, `/profile`, `/admin`, `/test-page`, `/topic`, `/login`, 404; глобальный `beforeEach` с авто-подгрузкой пользователя и редиректами.

- [ ] **Step 1: Создать `client-vue/src/views/PlaceholderView.vue`**

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <main class="container my-4">
    <h1>Страница «{{ String(route.name ?? route.path) }}» (заглушка)</h1>
    <p>Контент будет перенесён на следующих этапах миграции.</p>
  </main>
</template>
```

- [ ] **Step 2: Заменить содержимое `client-vue/src/router/index.ts`**

```ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import PlaceholderView from '@/views/PlaceholderView.vue'
import { decideRedirect } from './guards'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Главная' } },
    { path: '/about', name: 'about', component: PlaceholderView, meta: { title: 'О проекте' } },
    { path: '/contacts', name: 'contacts', component: PlaceholderView, meta: { title: 'Контакты' } },
    { path: '/criteria', name: 'criteria', component: PlaceholderView, meta: { title: 'Оценочные критерии' } },
    { path: '/profile', name: 'profile', component: PlaceholderView, meta: { title: 'Личный кабинет' } },
    { path: '/admin', name: 'admin', component: PlaceholderView, meta: { title: 'Кабинет администратора' } },
    { path: '/test-page', name: 'test-page', component: PlaceholderView, meta: { title: 'Тест' } },
    { path: '/topic', name: 'topic', component: PlaceholderView, meta: { title: 'Информация о теме' } },
    { path: '/login', name: 'login', component: PlaceholderView, meta: { title: 'Вход' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Страница не найдена' } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // /logout — служебный путь: выходим и идём на /login
  if (to.path === '/logout') {
    auth.logout()
    return '/login'
  }

  if (auth.isAuthenticated && !auth.user) {
    await auth.fetchCurrentUser()
  }

  const redirect = decideRedirect(to.path, auth.isAuthenticated, auth.user?.role)
  if (redirect && redirect !== to.path) return redirect
  return true
})

router.afterEach((to) => {
  const title = (to.meta.title as string) || 'Students Skill Tracker'
  document.title = title
})

export default router
```

- [ ] **Step 3: Проверить типы и сборку**

```bash
cd client-vue && npm run type-check && npm run build
```
Ожидаемо: без ошибок.

- [ ] **Step 4: Прогнать все юнит-тесты**

```bash
cd client-vue && npm run test:unit
```
Ожидаемо: все зелёные.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: таблица маршрутов и beforeEach-guard в client-vue"
```

---

## Task 10: Стили — дизайн-токены, layout-CSS, логотип

**Files:**
- Modify: `client-vue/src/assets/base.css`
- Create: `client-vue/src/assets/logo_vgik.png` (копия из `client/`)
- Create: `client-vue/src/assets/layout/header.css`, `menu.css`, `footer.css`, `bootstrap-overrides.css`, `cube-loader.css` (копии из `client/`)

**Interfaces:**
- Produces: глобальные дизайн-токены (`--color-bg`, `--menu-*` и пр.) и layout-стили, доступные всему приложению.

- [ ] **Step 1: Скопировать ассеты и CSS из старого клиента**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && \
cp client/src/assets/logo_vgik.png client-vue/src/assets/logo_vgik.png && \
mkdir -p client-vue/src/assets/layout && \
cp client/src/components/layout/Header.css client-vue/src/assets/layout/header.css && \
cp client/src/components/layout/Menu.css client-vue/src/assets/layout/menu.css && \
cp client/src/components/layout/Footer.css client-vue/src/assets/layout/footer.css && \
cp client/src/common/bootstrap-overrides.css client-vue/src/assets/layout/bootstrap-overrides.css && \
cp client/src/components/ui/CubeLoader.css client-vue/src/assets/layout/cube-loader.css && \
echo "скопировано" && ls client-vue/src/assets/layout
```
Ожидаемо: список из 5 .css файлов.

- [ ] **Step 2: Заменить содержимое `client-vue/src/assets/base.css`**

Скопировать `client/src/common/base.css` **дословно** (каркас App.vue использует `id="root"`, на который завязаны эти стили — селектор сохраняется как есть):
```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && cp client/src/common/base.css client-vue/src/assets/base.css && echo "base.css перенесён"
```

- [ ] **Step 3: Проверить сборку (CSS пока не импортирован — проверяем, что файлы валидны позже в Task 12)**

```bash
cd client-vue && npm run build
```
Ожидаемо: без ошибок (CSS подключим в Task 12).

- [ ] **Step 4: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "chore: перенести дизайн-токены, layout-CSS и логотип в client-vue"
```

---

## Task 11: Простые layout-компоненты (Header, Footer, Loader)

**Files:**
- Create: `client-vue/src/components/layout/AppHeader.vue`
- Create: `client-vue/src/components/layout/AppFooter.vue`
- Create: `client-vue/src/components/layout/AppLoader.vue`

**Interfaces:**
- Consumes: логотип `@/assets/logo_vgik.png`, `useUiStore` (Task 7).
- Produces: компоненты `AppHeader`, `AppFooter`, `AppLoader`.

- [ ] **Step 1: Создать `client-vue/src/components/layout/AppHeader.vue`**

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import logo from '@/assets/logo_vgik.png'
</script>

<template>
  <section id="header" class="header site-header">
    <div class="container-fluid">
      <div class="header-content d-flex align-items-center justify-content-between">
        <RouterLink to="/" class="logo-link text-decoration-none flex-shrink-0" aria-label="На главную">
          <img :src="logo" alt="Логотип" class="logo img-fluid" id="logo" />
        </RouterLink>
        <h1 class="text-end flex-grow-1 ms-3">
          <span class="header-title-line header-title-main">Кондитер-Pro</span>
          <span class="header-title-line">Контроль и оценка компетенций обучающихся</span>
          <span class="header-title-line">по учебному предмету "Специальная технология"</span>
        </h1>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 2: Создать `client-vue/src/components/layout/AppFooter.vue`**

```vue
<script setup lang="ts"></script>

<template>
  <section id="footer" class="footer site-footer">
    <footer class="text-center py-3">© 2026</footer>
  </section>
</template>
```

- [ ] **Step 3: Создать `client-vue/src/components/layout/AppLoader.vue`**

```vue
<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>

<template>
  <div v-show="ui.isLoading" class="cube-loader-container">
    <div class="content">
      <div class="cube"></div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Проверить сборку**

```bash
cd client-vue && npm run build
```
Ожидаемо: без ошибок.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: layout-компоненты AppHeader/AppFooter/AppLoader"
```

---

## Task 12: Меню с бургером + сборка каркаса App.vue

**Files:**
- Create: `client-vue/src/components/layout/AppMenu.vue`
- Modify: `client-vue/src/App.vue`
- Modify: `client-vue/src/main.ts` (импорт layout-CSS)

**Interfaces:**
- Consumes: `MENU_ITEMS` (определяется здесь), `useAuthStore`, логотип, layout-CSS.
- Produces: компонент `AppMenu` с реактивным бургер-меню; каркас `App.vue` (Header + Menu + RouterView + Footer + Loader).

- [ ] **Step 1: Создать `client-vue/src/components/layout/AppMenu.vue`**

Бургер реализован на реактивном `isOpen` (без Bootstrap JS): класс `show` вешается на `.navbar-collapse`, что активирует уже перенесённый CSS мобильного оверлея. Пункт «Выход» вызывает logout.

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import logo from '@/assets/logo_vgik.png'

interface MenuItem {
  title: string
  url: string
}

const MENU_ITEMS: MenuItem[] = [
  { title: 'Главная', url: '/' },
  { title: 'Оценочные критерии', url: '/criteria' },
  { title: 'Личный кабинет', url: '/profile' },
  { title: 'О проекте', url: '/about' },
  { title: 'Контакты', url: '/contacts' },
  { title: 'Выход', url: '/logout' },
]

const router = useRouter()
const auth = useAuthStore()
const isOpen = ref(false)

function isMobile(): boolean {
  return window.innerWidth <= 991
}

function openMenu(): void {
  isOpen.value = true
}

function closeMenu(): void {
  if (isMobile()) isOpen.value = false
}

async function handleItemClick(item: MenuItem): Promise<void> {
  closeMenu()
  if (item.url === '/logout') {
    auth.logout()
    await router.push('/login')
    return
  }
  await router.push(item.url)
}

function handleEscape(event: KeyboardEvent): void {
  if ((event.key === 'Escape' || event.key === 'Esc') && isOpen.value && isMobile()) {
    closeMenu()
  }
}

function handleResize(): void {
  if (!isMobile()) isOpen.value = false
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <section id="menu" class="menu site-menu">
    <nav class="navbar navbar-expand-lg" aria-label="Главная навигация">
      <div class="container-fluid">
        <RouterLink to="/" class="menu-logo-link text-decoration-none" aria-label="На главную" @click="closeMenu">
          <img :src="logo" alt="Логотип" class="menu-logo img-fluid" />
        </RouterLink>

        <button
          class="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          :aria-expanded="isOpen"
          aria-label="Открыть меню"
          @click="openMenu"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" :class="{ show: isOpen }" id="navbarNav">
          <button
            class="navbar-close-btn"
            type="button"
            aria-label="Закрыть меню"
            @click="isOpen = false"
          >
            <span class="navbar-close-icon">×</span>
          </button>

          <ul class="navbar-nav mx-auto">
            <li class="nav-item menu-mobile-title">
              <span class="nav-link menu-link menu-mobile-title-text">Меню</span>
            </li>
            <li v-for="item in MENU_ITEMS" :key="item.url" class="nav-item">
              <a
                :href="item.url"
                class="nav-link menu-link"
                @click.prevent="handleItemClick(item)"
                >{{ item.title }}</a
              >
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </section>
</template>
```

- [ ] **Step 2: Заменить содержимое `client-vue/src/App.vue`**

```vue
<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppMenu from '@/components/layout/AppMenu.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppLoader from '@/components/layout/AppLoader.vue'
</script>

<template>
  <div id="root">
    <AppHeader />
    <AppMenu />
    <RouterView />
    <AppFooter />
    <AppLoader />
  </div>
</template>
```

- [ ] **Step 3: Импортировать layout-CSS в `client-vue/src/main.ts`**

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from '@/router'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/assets/base.css'
import '@/assets/layout/header.css'
import '@/assets/layout/menu.css'
import '@/assets/layout/footer.css'
import '@/assets/layout/bootstrap-overrides.css'
import '@/assets/layout/cube-loader.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

- [ ] **Step 4: Проверить типы, сборку и линт**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: всё зелёное.

- [ ] **Step 5: Ручная проверка каркаса (dev-сервер)**

```bash
cd client-vue && npm run dev
```
Открыть `http://localhost:5173/login` — видно шапку (логотип + заголовки), меню, футер, страницу-заглушку «login». На десктопе пункты меню в ряд; при сужении окна < 992px появляется бургер, по клику — полноэкранный оверлей со списком, «×» закрывает. Остановить сервер (Ctrl+C).

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: меню с бургером и каркас App.vue (layout-shell)"
```

---

## Definition of Done (Этап 1)

- [ ] `npm run test:unit` — все юнит-тесты зелёные (errors, tokenStorage, http, auth, stores/auth, guards).
- [ ] `npm run type-check`, `npm run build`, `npm run lint` — без ошибок.
- [ ] API-слой `src/api/*` переносит поведение `services/*` (кроме отложенного: тосты, файловые/админ-методы).
- [ ] Pinia `authStore` хранит user/token, умеет login/register/logout/fetchCurrentUser; `uiStore` — лоадер.
- [ ] Vue Router: полная таблица маршрутов; `beforeEach` повторяет auth/admin-редиректы и `/logout`.
- [ ] Каркас `App.vue` рендерит Header + Menu (с рабочим бургером) + RouterView + Footer + Loader; дизайн-токены и layout-стили перенесены.
- [ ] Все коммиты локально в `feat/vue-rewrite`; `client/` и `server/` не тронуты; на GitHub не запушено.
```
