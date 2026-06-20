# Этап 6: Админка (Admin) + редактирование темы (CKEditor) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести кабинет преподавателя (`/admin`): аккордеон результатов студентов по группам, файлы студента (скачать/удалить), удаление пользователя; плюс админ-режим редактирования контента темы через CKEditor на странице темы (отложено из Этапа 4) — поведение 1-в-1.

**Architecture:** Чистая логика (оценки/форматирование админки) — `utils/adminFormat.ts` (порт `AdminPageRenderer`, **своя** шкала оценок, отличная от теста). API — `api/admin.ts` (`getGroupedResults`, `getStudentFiles`, `deleteStudentFile`, `getStudentFileDownloadUrl`, `deleteUser`) и `updateTopicContent` в `api/topics.ts`. UI админки: `components/admin/*` (StudentTests, StudentFiles, StudentAccordion) + `views/AdminView.vue`. CKEditor — тонкая обёртка `components/editors/CkeditorClassic.vue` (classic build, как в старом клиенте); правка темы — расширение `views/TopicView.vue` (кнопка «Редактировать» для админа).

**Tech Stack:** Vue 3 `<script setup>` + TS, Vue Router 4, Pinia, Vitest + @vue/test-utils, Bootstrap 5, `@ckeditor/ckeditor5-build-classic` (^41).

## Global Constraints

- Весь код — в `client-vue/`. `client/` и `server/` НЕ менять.
- Имена компонентов многословные: `AdminView`, `StudentAccordion`, `StudentTests`, `StudentFiles`, `CkeditorClassic`.
- Точная копия вёрстки/поведения; CSS переносим **дословно** в `assets/pages/admin.css`.
- **Шкала оценок админки отличается от теста** (`AdminPageRenderer.getGradeByPercent`): для 10 вопросов — ровные диапазоны [1-10→1, 11-20→2, …, 91-100→10]; для 15 — как у теста. Копировать дословно, НЕ переиспользовать `testScoring.getGrade`.
- Эндпоинты (JWT, только admin): `GET /admin/results` → `{ groups, noGroup }`; `GET /admin/students/:id/files` → `{ success, files }`; `DELETE /admin/files/:key`; `GET /admin/files/:key/download` → `{ url }`; `DELETE /admin/users/:id`; `PUT /topics/:id/content` → `{ success, message }`.
- Подтверждения удаления — нативный `confirm()` с теми же текстами; уведомления — `useNotificationStore` (как в Этапах 2–3).
- Ветка `feat/vue-rewrite`, коммиты только локально, на GitHub НЕ пушим.
- В конце каждой задачи: `test:unit`, `type-check`, `build`, `lint` — зелёные.

## Перенос и осознанные решения по объёму

| Старое (`client/src/...`) | Новое (`client-vue/src/...`) |
|---|---|
| `pages/Admin/AdminPageRenderer.js` (логика оценок/формата) | `utils/adminFormat.ts` |
| `pages/Admin/AdminPageRenderer.js` (рендер) | `components/admin/{StudentTests,StudentFiles,StudentAccordion}.vue` |
| `pages/Admin/Admin.js` (загрузка/события) | `views/AdminView.vue` |
| `services/userService` admin-методы | `api/admin.ts` |
| `components/editors/CKEditorComponent.js` | `components/editors/CkeditorClassic.vue` |
| `pages/TopicPage/TopicPage.js` (edit mode) | расширение `views/TopicView.vue` |
| `pages/Admin/Admin.css` | `assets/pages/admin.css` |

**Вне объёма / осознанные решения:**
- **Drag-and-drop сортировка** (упомянута в спеке для админки) в актуальном коде админки **отсутствует** — переносить нечего. DnD для ordering-вопросов уже сделан в Этапе 5.
- Защиту маршрута `/admin` от не-админов не усиливаем (в старом клиенте её нет; сервер отдаёт 403, гард уже редиректит admin `/profile`→`/admin`). 1-в-1.
- `confirm()`/`alert()` сохраняем как в старом клиенте (нативные), без замены на модалки.

---

## Структура файлов (создаётся в этом этапе)

```
client-vue/src/
├─ api/
│  ├─ admin.ts            getGroupedResults, getStudentFiles, deleteStudentFile,
│  │                      getStudentFileDownloadUrl, deleteUser
│  └─ admin.spec.ts
├─ utils/
│  ├─ adminFormat.ts      getGradeForTest, getGradeByPercent, getMaxPointsByCount,
│  │                      formatDate, formatAnswers, formatTestSummary, getTestTitle, formatValue
│  └─ adminFormat.spec.ts
├─ components/
│  ├─ admin/
│  │  ├─ StudentTests.vue
│  │  ├─ StudentFiles.vue
│  │  └─ StudentAccordion.vue
│  └─ editors/
│     └─ CkeditorClassic.vue
├─ views/
│  └─ AdminView.vue
└─ assets/pages/admin.css
```

Изменяются: `api/config.ts` (эндпоинты admin), `api/types.ts` (типы admin), `api/topics.ts` (`updateTopicContent`), `router/index.ts` (`/admin`→AdminView), `main.ts` (admin.css), `views/TopicView.vue` (edit mode).

---

## Task 1: API админки + обновление контента темы

**Files:**
- Modify: `client-vue/src/api/config.ts`
- Modify: `client-vue/src/api/types.ts`
- Create: `client-vue/src/api/admin.ts`
- Modify: `client-vue/src/api/topics.ts`
- Create: `client-vue/src/api/admin.spec.ts`

**Interfaces:**
- Consumes: `http`, `API_CONFIG`, `tokenStorage`, `isAuthError`.
- Produces:
  - `getGroupedResults(): Promise<GroupedResultsResult>`
  - `getStudentFiles(studentId: number | string): Promise<FilesResult>`
  - `deleteStudentFile(key: string): Promise<DeleteResult>`
  - `getStudentFileDownloadUrl(key: string): Promise<DownloadUrlResult>`
  - `deleteUser(userId: number | string): Promise<DeleteResult>`
  - `updateTopicContent(id: number | string, content: unknown): Promise<{ success: boolean; message?: string; error?: string }>`
  - типы `AdminTest`, `AdminStudent`, `AdminGroup`, `GroupedResults`, `GroupedResultsResult`.

- [ ] **Step 1: Добавить эндпоинты admin в `client-vue/src/api/config.ts`**

В объект `ENDPOINTS` (после `UPLOAD`) добавить:

```ts
    ADMIN: {
      RESULTS: '/admin/results',
      STUDENT_FILES: '/admin/students',
      FILES: '/admin/files',
      USERS: '/admin/users',
    },
```

- [ ] **Step 2: Добавить типы в конец `client-vue/src/api/types.ts`**

```ts
export interface AdminTest {
  test_title?: string
  test_code?: string
  variant?: number
  score?: number
  max_points?: number
  total_questions?: number
  grade?: number
  completed_at?: string
  answers_details?: Array<{
    type?: string
    questionNumber?: number
    userAnswer?: unknown
    correct?: unknown
    isCorrect?: boolean
    score?: number
  }>
}

export interface AdminStudent {
  id: number
  fullName?: string
  email?: string
  groupNumber?: string
  tests?: AdminTest[]
  files?: UserFile[]
}

export interface AdminGroup {
  groupNumber: string
  students: AdminStudent[]
}

export interface GroupedResults {
  groups: AdminGroup[]
  noGroup: AdminStudent[]
}

export interface GroupedResultsResult {
  success: boolean
  data: GroupedResults
  error?: string
}
```

- [ ] **Step 3: Написать падающий тест `client-vue/src/api/admin.spec.ts`**

```ts
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
```

- [ ] **Step 4: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- admin.spec
```
Ожидаемо: FAIL (модуль не найден).

- [ ] **Step 5: Создать `client-vue/src/api/admin.ts`**

```ts
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
```

- [ ] **Step 6: Добавить `updateTopicContent` в конец `client-vue/src/api/topics.ts`**

```ts
export async function updateTopicContent(
  id: number | string,
  content: unknown,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const data = await http.put<{ success?: boolean; message?: string }>(
      `${API_CONFIG.ENDPOINTS.TOPIC_CONTENT}/${id}/content`,
      { content },
      { context: 'topics.updateTopicContent' },
    )
    if (data?.success) {
      return { success: true, message: data.message || 'Контент успешно сохранен' }
    }
    return { success: false, error: 'Ошибка при сохранении' }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
```

> `topics.ts` уже импортирует `http` и `API_CONFIG` — новых импортов не требуется.

- [ ] **Step 7: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- admin.spec && npm run type-check
```
Ожидаемо: PASS, type-check без ошибок.

- [ ] **Step 8: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: api/admin + updateTopicContent + tipy/endpoints"
```

---

## Task 2: Логика админки — оценки и форматирование (TDD)

**Files:**
- Create: `client-vue/src/utils/adminFormat.ts`
- Create: `client-vue/src/utils/adminFormat.spec.ts`

**Interfaces:**
- Consumes: тип `AdminTest`.
- Produces (порт `AdminPageRenderer`, дословно):
  - `getMaxPointsByCount(count?: number): number | null`
  - `getGradeByPercent(scorePercent: number, questionCount?: number): number`
  - `getGradeForTest(test: AdminTest): number | null`
  - `getTestTitle(test: AdminTest): string`
  - `formatValue(value: unknown): string`
  - `formatDate(dateString?: string, includeTime?: boolean): string`
  - `formatTestSummary(test: AdminTest): string`
  - `escapeHtml(text: unknown): string`

- [ ] **Step 1: Написать падающий тест `client-vue/src/utils/adminFormat.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { getGradeByPercent, getGradeForTest, getMaxPointsByCount, formatTestSummary } from './adminFormat'

describe('getMaxPointsByCount', () => {
  it('10 и 15 → 100', () => {
    expect(getMaxPointsByCount(10)).toBe(100)
    expect(getMaxPointsByCount(15)).toBe(100)
  })
  it('иное → null', () => {
    expect(getMaxPointsByCount(7)).toBeNull()
  })
})

describe('getGradeByPercent (админская шкала, ровные диапазоны для 10)', () => {
  it('5% (10 вопросов) → 1', () => {
    expect(getGradeByPercent(5, 10)).toBe(1)
  })
  it('100% (10 вопросов) → 10', () => {
    expect(getGradeByPercent(100, 10)).toBe(10)
  })
  it('45% (10 вопросов) → 5', () => {
    expect(getGradeByPercent(45, 10)).toBe(5)
  })
})

describe('getGradeForTest', () => {
  it('score 100/100 на 10 вопросов → 10', () => {
    expect(getGradeForTest({ score: 100, max_points: 100, total_questions: 10 })).toBe(10)
  })
  it('нет score → null', () => {
    expect(getGradeForTest({ total_questions: 10 })).toBeNull()
  })
})

describe('formatTestSummary', () => {
  it('баллы из максимума', () => {
    expect(formatTestSummary({ score: 80, max_points: 100, total_questions: 10 })).toBe(
      '80 баллов из 100',
    )
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- adminFormat
```
Ожидаемо: FAIL.

- [ ] **Step 3: Создать `client-vue/src/utils/adminFormat.ts`**

```ts
import type { AdminTest } from '@/api/types'

export function escapeHtml(text: unknown): string {
  if (text === null || text === undefined) return ''
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function getTestTitle(test: AdminTest): string {
  return test?.test_title || test?.test_code || ''
}

export function getMaxPointsByCount(count?: number | null): number | null {
  return count === 10 || count === 15 ? 100 : null
}

// ВНИМАНИЕ: админская шкала отличается от теста (ровные диапазоны для 10).
export function getGradeByPercent(scorePercent: number, questionCount?: number): number {
  const gradingScale: Record<number, number[][]> = {
    10: [
      [1, 10, 1],
      [11, 20, 2],
      [21, 30, 3],
      [31, 40, 4],
      [41, 50, 5],
      [51, 60, 6],
      [61, 70, 7],
      [71, 80, 8],
      [81, 90, 9],
      [91, 100, 10],
    ],
    15: [
      [1, 8, 1],
      [9, 16, 2],
      [17, 26, 3],
      [27, 36, 4],
      [37, 48, 5],
      [49, 59, 6],
      [60, 70, 7],
      [71, 80, 8],
      [81, 91, 9],
      [92, 100, 10],
    ],
  }
  const percent = Number.isFinite(scorePercent) ? scorePercent : 0
  const normalized = Math.max(0, Math.min(100, percent))
  const scale = gradingScale[questionCount ?? 10] || gradingScale[10]
  return scale.find(([min, max]) => normalized >= min && normalized <= max)?.[2] ?? 0
}

export function getGradeForTest(test: AdminTest): number | null {
  if (!test || typeof test.score !== 'number') return null
  const maxPoints =
    typeof test.max_points === 'number' && test.max_points > 0
      ? test.max_points
      : getMaxPointsByCount(test.total_questions)
  if (!maxPoints || maxPoints <= 0) return null
  const percentage = Math.round((test.score / maxPoints) * 100)
  return getGradeByPercent(percentage, test.total_questions)
}

export function formatDate(dateString?: string, includeTime = true): string {
  if (!dateString) return '-'
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  }
  return new Date(dateString).toLocaleDateString('ru-RU', options)
}

export function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return (value ?? '') as string
}

export function formatTestSummary(test: AdminTest): string {
  if (
    typeof test.score !== 'number' ||
    (typeof test.max_points !== 'number' && typeof test.total_questions !== 'number')
  ) {
    return '-'
  }
  const maxPoints =
    test.max_points ?? getMaxPointsByCount(test.total_questions) ?? test.total_questions
  return `${test.score} баллов из ${maxPoints}`
}
```

> Примечание: в `formatValue` порядок проверок — сначала `Array.isArray` (иначе `typeof [] === 'object'` перехватит массив). Это сохраняет поведение старого кода (массив → join).

- [ ] **Step 4: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- adminFormat
```
Ожидаемо: PASS.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: utils/adminFormat (ocenki/format admin) s testami"
```

---

## Task 3: Компоненты тестов и файлов студента + CSS

**Files:**
- Create: `client-vue/src/assets/pages/admin.css` (копия `client/src/pages/Admin/Admin.css`)
- Modify: `client-vue/src/main.ts` (импорт admin.css)
- Create: `client-vue/src/components/admin/StudentTests.vue`
- Create: `client-vue/src/components/admin/StudentFiles.vue`

**Interfaces:**
- Consumes: `adminFormat` (getTestTitle, formatDate, formatTestSummary, getGradeForTest, formatValue), `formatFileSize` из `@/utils/format`, `getStudentFileDownloadUrl`, `deleteStudentFile`, `useNotificationStore`, типы `AdminTest`, `UserFile`.
- Produces:
  - `StudentTests` — props `{ tests: AdminTest[] }`.
  - `StudentFiles` — props `{ files: UserFile[]; studentId: number }`, emit `deleted(key: string)` (чтобы родитель обновил индикатор).

- [ ] **Step 1: Скопировать CSS и подключить**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && cp client/src/pages/Admin/Admin.css client-vue/src/assets/pages/admin.css && echo ok
```
В `client-vue/src/main.ts` после `import '@/assets/pages/test/progress.css'` добавить:
```ts
import '@/assets/pages/admin.css'
```

- [ ] **Step 2: Создать `client-vue/src/components/admin/StudentTests.vue`** (порт `renderStudentTests` + `formatAnswers`)

```vue
<script setup lang="ts">
import { getTestTitle, formatDate, formatTestSummary, getGradeForTest, formatValue } from '@/utils/adminFormat'
import type { AdminTest } from '@/api/types'

const props = defineProps<{ tests: AdminTest[] }>()

function titleWithVariant(test: AdminTest): string {
  const title = getTestTitle(test) || '-'
  const needVariant = typeof test.variant === 'number' && !/вариант/i.test(title)
  return `${title}${needVariant ? `, вариант ${test.variant}` : ''}`
}

function summaryWithGrade(test: AdminTest): string {
  const grade = getGradeForTest(test) ?? (typeof test.grade === 'number' ? test.grade : null)
  return `Итог: ${formatTestSummary(test)}${grade !== null ? `, Оценка: ${grade}` : ''}`
}
</script>

<template>
  <p v-if="!props.tests || props.tests.length === 0" class="no-tests-message">
    Нет пройденных тестов.
  </p>
  <div v-else class="student-tests-list">
    <div v-for="(test, i) in props.tests" :key="i" class="test-result-item">
      <div class="test-header">
        <div class="test-title">{{ titleWithVariant(test) }}</div>
        <div class="test-date">Дата: {{ formatDate(test.completed_at) }}</div>
      </div>
      <div class="test-details">
        <p v-if="!test.answers_details || test.answers_details.length === 0">-</p>
        <div v-else class="answers-details">
          <template v-for="(d, di) in test.answers_details" :key="di">
            <template v-if="di > 0"><br /><br /></template>
            Вопрос {{ d.questionNumber || '' }} ({{ d.type || '' }}):<br />
            Ответ пользователя: {{ formatValue(d.userAnswer) }}<br />
            Правильные ответы: {{ formatValue(d.correct) }}<br />
            Верно: {{ d.isCorrect ? 'true' : 'false' }}, Начисленные баллы: {{ d.score ?? 0 }}
          </template>
        </div>
        <div class="test-summary">{{ summaryWithGrade(test) }}</div>
      </div>
    </div>
  </div>
</template>
```

> Старый код собирал ответы через `formatAnswers` с `<br/>` и `escape` в innerHTML. Здесь используем текстовую интерполяцию (`{{ }}`), которая экранирует автоматически — XSS-безопасно и визуально идентично (детали ответов — это текст).

- [ ] **Step 3: Создать `client-vue/src/components/admin/StudentFiles.vue`** (порт `renderStudentFiles` + download/delete)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { formatFileSize } from '@/utils/format'
import { formatDate } from '@/utils/adminFormat'
import { getStudentFileDownloadUrl, deleteStudentFile } from '@/api/admin'
import { getErrorMessage } from '@/api/errors'
import { useNotificationStore } from '@/stores/notifications'
import type { UserFile } from '@/api/types'

const props = defineProps<{ files: UserFile[]; studentId: number }>()
const emit = defineEmits<{ (e: 'deleted', key: string): void }>()

const notify = useNotificationStore()
const list = ref<UserFile[]>([...props.files])
const busy = ref<Record<string, boolean>>({})

function triggerDownload(href: string, fileName: string, revoke: boolean): void {
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  link.classList.add('hidden')
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    document.body.removeChild(link)
    if (revoke) URL.revokeObjectURL(href)
  }, 100)
}

async function download(file: UserFile): Promise<void> {
  busy.value[file.key] = true
  try {
    const result = await getStudentFileDownloadUrl(file.key)
    if (!result.success || !result.url) {
      notify.error('Ошибка при получении ссылки на файл: ' + (result.error || 'Неизвестная ошибка'))
      return
    }
    const fileName = file.fileName || file.key.split('/').pop() || 'download'
    try {
      const response = await fetch(result.url, { method: 'GET', mode: 'cors' })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const blob = await response.blob()
      triggerDownload(URL.createObjectURL(blob), fileName, true)
    } catch {
      triggerDownload(result.url, fileName, false)
    }
  } catch (error) {
    notify.error('Ошибка при скачивании файла: ' + getErrorMessage(error))
  } finally {
    busy.value[file.key] = false
  }
}

async function remove(file: UserFile): Promise<void> {
  if (!confirm('Вы уверены, что хотите удалить этот файл?')) return
  busy.value[file.key] = true
  try {
    const result = await deleteStudentFile(file.key)
    if (result.success) {
      list.value = list.value.filter((f) => f.key !== file.key)
      emit('deleted', file.key)
      notify.success('Файл успешно удален')
    } else {
      notify.error(result.error || 'Ошибка при удалении файла')
    }
  } catch (error) {
    notify.error('Ошибка при удалении файла: ' + getErrorMessage(error))
  } finally {
    busy.value[file.key] = false
  }
}
</script>

<template>
  <div class="student-files-section">
    <template v-if="!list || list.length === 0">
      <h4 class="files-section-title">Загруженные файлы</h4>
      <p class="no-files-message">Нет загруженных файлов</p>
    </template>
    <template v-else>
      <h4 class="files-section-title files-section-title-with-border">
        Загруженные файлы ({{ list.length }})
      </h4>
      <div class="files-list-admin">
        <div v-for="file in list" :key="file.key" class="file-item-admin" :data-key="file.key">
          <div class="file-info-admin">
            <span class="file-name-admin">{{ file.fileName }}</span>
            <span class="file-size-admin">{{ formatFileSize(file.size) }}</span>
            <span class="file-date-admin">{{ formatDate(file.lastModified, false) }}</span>
          </div>
          <div class="file-actions-admin">
            <button class="file-download-admin" :disabled="busy[file.key]" title="Скачать" @click="download(file)">
              ⬇️ Скачать
            </button>
            <button type="button" class="file-delete-admin" :disabled="busy[file.key]" title="Удалить" @click="remove(file)">
              🗑️ Удалить
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
```

- [ ] **Step 4: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: зелёное.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: StudentTests i StudentFiles + admin.css"
```

---

## Task 4: Аккордеон студента, страница AdminView + маршрут

**Files:**
- Create: `client-vue/src/components/admin/StudentAccordion.vue`
- Create: `client-vue/src/views/AdminView.vue`
- Modify: `client-vue/src/router/index.ts`

**Interfaces:**
- Consumes: `StudentTests`, `StudentFiles`, `getGroupedResults`, `deleteUser`, `useNotificationStore`, типы `AdminStudent`, `AdminGroup`.
- Produces:
  - `StudentAccordion` — props `{ student: AdminStudent; index: number }`, emit `deletedUser(id: number)`. Заголовок (имя/email, кол-во тестов, индикатор файлов, кнопка «Удалить»), раскрытие по клику на header, кнопка удаления — `confirm` + `deleteUser`.
  - `AdminView` — грузит результаты, рендерит группы и «без группы», обрабатывает удаление пользователя (после успеха — перезагрузка через 1.5с, как в старом).

- [ ] **Step 1: Создать `client-vue/src/components/admin/StudentAccordion.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import StudentTests from './StudentTests.vue'
import StudentFiles from './StudentFiles.vue'
import { deleteUser } from '@/api/admin'
import { getErrorMessage } from '@/api/errors'
import { useNotificationStore } from '@/stores/notifications'
import type { AdminStudent } from '@/api/types'

const props = defineProps<{ student: AdminStudent; index: number }>()
const emit = defineEmits<{ (e: 'deletedUser', id: number): void }>()

const notify = useNotificationStore()
const open = ref(false)
const fileCount = ref(props.student.files?.length || 0)
const deleting = ref(false)

const fullName = (props.student.fullName || '').trim()
const headerName = `${fullName}${props.student.email ? `, ${props.student.email}` : ''}`

function toggle(): void {
  open.value = !open.value
}

async function onDelete(): Promise<void> {
  const userName = fullName || 'пользователя'
  if (
    !confirm(
      `Вы уверены, что хотите удалить пользователя "${userName}"?\n\nЭто действие удалит:\n- Пользователя\n- Все его тесты\n- Все его файлы\n\nЭто действие нельзя отменить!`,
    )
  ) {
    return
  }
  deleting.value = true
  try {
    const result = await deleteUser(props.student.id)
    if (result.success) {
      notify.success('Пользователь успешно удален')
      emit('deletedUser', props.student.id)
    } else {
      notify.error(result.error || 'Ошибка при удалении пользователя')
      deleting.value = false
    }
  } catch (error) {
    notify.error('Ошибка при удалении пользователя: ' + getErrorMessage(error))
    deleting.value = false
  }
}
</script>

<template>
  <div class="accordion-item" :data-student-id="student.id">
    <div class="accordion-header" :class="{ active: open }" :aria-expanded="open" @click="toggle">
      <span class="student-number">{{ index + 1 }}.</span>
      <span class="student-name">{{ headerName }}</span>
      <div class="header-right-group">
        <span class="tests-count">Тестов: {{ student.tests?.length || 0 }}</span>
        <span class="files-indicator" :class="{ 'no-files': fileCount === 0 }" :data-student-id="student.id">
          {{ fileCount > 0 ? `📁 Файлов: ${fileCount}` : '📁 Нет файлов' }}
        </span>
        <button class="delete-user-btn" type="button" :disabled="deleting" title="Удалить пользователя" @click.stop="onDelete">
          Удалить
        </button>
        <span class="accordion-icon">▼</span>
      </div>
    </div>
    <div class="accordion-content" :class="{ active: open }">
      <StudentTests :tests="student.tests || []" />
      <StudentFiles
        :files="student.files || []"
        :student-id="student.id"
        @deleted="fileCount = Math.max(0, fileCount - 1)"
      />
    </div>
  </div>
</template>
```

> Старый клиент при удалении файла пересчитывал индикатор повторным запросом; здесь декрементируем счётчик локально (эквивалент по UX, без лишнего запроса). Раскрытие аккордеона — классы `active` на header и content, как в CSS.

- [ ] **Step 2: Создать `client-vue/src/views/AdminView.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getGroupedResults } from '@/api/admin'
import StudentAccordion from '@/components/admin/StudentAccordion.vue'
import type { AdminGroup, AdminStudent } from '@/api/types'

const groups = ref<AdminGroup[]>([])
const noGroup = ref<AdminStudent[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMessage = ref('')

async function load(): Promise<void> {
  status.value = 'loading'
  const result = await getGroupedResults()
  if (result.success) {
    groups.value = result.data.groups
    noGroup.value = result.data.noGroup
    status.value = 'ready'
  } else {
    errorMessage.value = result.error || 'Ошибка загрузки данных'
    status.value = 'error'
  }
}

function onDeletedUser(): void {
  // Как в старом клиенте: после удаления перезагружаем страницу через 1.5с.
  setTimeout(() => window.location.reload(), 1500)
}

onMounted(load)
</script>

<template>
  <main id="admin" class="container my-4">
    <h1>Кабинет преподавателя</h1>
    <section>
      <div class="test-results-section">
        <div v-if="status === 'loading'" class="admin-loading">Загрузка...</div>
        <div v-else-if="status === 'error'" class="no-results">
          <p>{{ errorMessage }}</p>
        </div>
        <template v-else>
          <template v-if="groups.length">
            <template v-for="group in groups" :key="group.groupNumber">
              <h3>Группа {{ group.groupNumber }}</h3>
              <div class="admin-accordion">
                <StudentAccordion
                  v-for="(student, i) in group.students"
                  :key="student.id"
                  :student="student"
                  :index="i"
                  @deleted-user="onDeletedUser"
                />
              </div>
            </template>
          </template>
          <p v-else>Нет данных по группам.</p>

          <hr />

          <template v-if="noGroup.length">
            <h3>Пользователи без указанной группы</h3>
            <div class="admin-accordion">
              <StudentAccordion
                v-for="(student, i) in noGroup"
                :key="student.id"
                :student="student"
                :index="i"
                @deleted-user="onDeletedUser"
              />
            </div>
          </template>
          <p v-else class="no-group-message">Нет пользователей без указанной группы.</p>
        </template>
      </div>
    </section>
  </main>
</template>
```

- [ ] **Step 3: Переключить маршрут `admin` в `client-vue/src/router/index.ts`**

Добавить `import AdminView from '@/views/AdminView.vue'`; в маршруте `admin` заменить `component: PlaceholderView` на `component: AdminView`.

- [ ] **Step 4: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: зелёное.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: StudentAccordion i AdminView + marshrut /admin"
```

---

## Task 5: Обёртка CKEditor

**Files:**
- Modify: `client-vue/package.json` (через npm)
- Create: `client-vue/src/components/editors/CkeditorClassic.vue`

**Interfaces:**
- Consumes: `@ckeditor/ckeditor5-build-classic`.
- Produces: `CkeditorClassic` — props `{ modelValue: string; placeholder?: string }`, emit `update:modelValue`. Тулбар — как в старом `CKEditorComponent` (heading, bold, italic, underline, bulletedList, numberedList, blockQuote, link, undo, redo).

- [ ] **Step 1: Установить CKEditor classic build**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2/client-vue" && npm install @ckeditor/ckeditor5-build-classic@^41
```
Ожидаемо: пакет добавлен.

- [ ] **Step 2: Создать `client-vue/src/components/editors/CkeditorClassic.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
// @ts-expect-error — у classic build нет своих типов в этом окружении
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

const props = withDefaults(
  defineProps<{ modelValue: string; placeholder?: string }>(),
  { placeholder: 'Введите содержание темы...' },
)
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const el = ref<HTMLDivElement | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let editor: any = null

onMounted(async () => {
  if (!el.value) return
  editor = await ClassicEditor.create(el.value, {
    placeholder: props.placeholder,
    toolbar: [
      'heading',
      '|',
      'bold',
      'italic',
      'underline',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'blockQuote',
      'link',
      '|',
      'undo',
      'redo',
    ],
  })
  editor.setData(props.modelValue || '')
  editor.model.document.on('change:data', () => {
    emit('update:modelValue', editor.getData())
  })
})

onBeforeUnmount(async () => {
  if (editor) {
    await editor.destroy()
    editor = null
  }
})
</script>

<template>
  <div ref="el"></div>
</template>
```

> Обёртка повторяет поведение старого `CKEditorComponent` (classic build, тот же тулбар, init/destroy), но через жизненный цикл Vue и `v-model`. Старый код создавал `<textarea>` и вызывал `create(textarea)`; CKEditor 5 одинаково принимает любой элемент — используем `<div>`.

- [ ] **Step 3: Проверить сборку (CKEditor бандлится Vite)**

```bash
cd client-vue && npm run type-check && npm run build
```
Ожидаемо: без ошибок. Если Vite ругается на CommonJS-интероп CKEditor — добавить в `vite.config.ts` в `optimizeDeps.include` строку `'@ckeditor/ckeditor5-build-classic'` и повторить (это конфигурационная правка в рамках данной задачи).

- [ ] **Step 4: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: CkeditorClassic obertka (classic build) dlya Vue"
```

---

## Task 6: Админ-режим редактирования темы в TopicView

**Files:**
- Modify: `client-vue/src/views/TopicView.vue`

**Interfaces:**
- Consumes: `useAuthStore` (роль), `extractTextFromContent` из `@/utils/topicContent`, `updateTopicContent` из `@/api/topics`, `CkeditorClassic`, `useNotificationStore`.
- Produces: в режиме просмотра для админа — кнопка «Редактировать»; в режиме правки — `CkeditorClassic` + «Сохранить»/«Отмена». Поведение — как `TopicPage` (Save → PUT content → обновить локальный контент → выход из правки).

- [ ] **Step 1: Прочитать текущий `client-vue/src/views/TopicView.vue`**

Изучить существующую структуру (статусы, `topic`, `contentHtml`, шапка с `<h1>`), чтобы встроить кнопки и режим правки, не ломая Этап 4.

- [ ] **Step 2: Заменить `<script setup>` `client-vue/src/views/TopicView.vue` на версию с режимом правки**

```ts
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTopic, updateTopicContent } from '@/api/topics'
import { renderContent, extractTextFromContent } from '@/utils/topicContent'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import CkeditorClassic from '@/components/editors/CkeditorClassic.vue'
import type { Topic } from '@/api/types'

const route = useRoute()
const auth = useAuthStore()
const notify = useNotificationStore()

const topic = ref<Topic | null>(null)
const status = ref<'loading' | 'no-id' | 'not-found' | 'error' | 'ready'>('loading')

const isEditMode = ref(false)
const editorData = ref('')
const saving = ref(false)

const isAdmin = computed(() => auth.user?.role === 'admin')
const title = computed(() => topic.value?.name || 'Тема')
const contentHtml = computed(() => (topic.value ? renderContent(topic.value) : ''))

async function load(): Promise<void> {
  const topicId = route.query.topicId as string | undefined
  if (!topicId) {
    status.value = 'no-id'
    return
  }
  status.value = 'loading'
  isEditMode.value = false
  try {
    const result = await getTopic(topicId)
    if (result.success && result.topic) {
      topic.value = result.topic
      status.value = 'ready'
    } else {
      status.value = 'not-found'
    }
  } catch {
    status.value = 'error'
  }
}

function startEdit(): void {
  if (!topic.value) return
  editorData.value = extractTextFromContent(topic.value.content) || ''
  isEditMode.value = true
}

function cancelEdit(): void {
  isEditMode.value = false
}

async function save(): Promise<void> {
  if (!topic.value) return
  saving.value = true
  try {
    const result = await updateTopicContent(topic.value.id, editorData.value)
    if (result.success) {
      topic.value = { ...topic.value, content: editorData.value }
      isEditMode.value = false
      notify.success('Контент успешно сохранен!')
    } else {
      notify.error(`Ошибка: ${result.error || 'не удалось сохранить'}`)
    }
  } finally {
    saving.value = false
  }
}

onMounted(load)
watch(() => route.query.topicId, load)
```

- [ ] **Step 3: Заменить `<template>` `client-vue/src/views/TopicView.vue`**

```vue
<template>
  <main id="topic" class="container my-4">
    <div class="topic-page-header">
      <h1>{{ status === 'ready' ? title : status === 'no-id' ? 'Темы' : 'Тема' }}</h1>
      <div v-if="status === 'ready' && isAdmin && !isEditMode" class="topic-actions topic-actions--edit">
        <button class="btn btn-primary" @click="startEdit">Редактировать</button>
      </div>
      <div v-else-if="status === 'ready' && isAdmin && isEditMode" class="topic-actions">
        <button class="btn btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
        </button>
        <button class="btn btn-secondary" :disabled="saving" @click="cancelEdit">Отмена</button>
      </div>
    </div>
    <section>
      <div class="topic-page" :class="{ 'edit-mode': isEditMode }">
        <div v-if="status === 'loading'" class="topic-loading">Загрузка темы...</div>
        <p v-else-if="status === 'no-id'" class="error-note">ID темы не указан.</p>
        <p v-else-if="status === 'not-found'" class="error-note">Не удалось загрузить тему.</p>
        <p v-else-if="status === 'error'" class="error-note">Ошибка при загрузке темы.</p>
        <div v-else-if="isEditMode" class="topic-editor-container">
          <CkeditorClassic v-model="editorData" />
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-else v-html="contentHtml"></div>
      </div>
    </section>
  </main>
</template>
```

> `v-html` для просмотра контента остаётся (как в Этапе 4) — контент темы это санитайзенный HTML от админа через `renderContent`/`sanitizeHtml`. Это не новая находка: тот же подход, что приняли в Этапе 4 для тем.

- [ ] **Step 4: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: зелёное.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: admin-rezhim redaktirovaniya temy (CKEditor) v TopicView"
```

---

## Task 7: Финальная проверка и ручная сверка

**Files:** (изменений кода нет — проверка)

- [ ] **Step 1: Полный прогон**

```bash
cd client-vue && npm run test:unit && npm run type-check && npm run build && npm run lint
```
Ожидаемо: все тесты зелёные, без ошибок.

- [ ] **Step 2: Ручная сверка (нужен backend на :3000)**

Поднять API-мост (если стек в docker, server не публикует порт):
```bash
docker run -d --rm --name vite-api-bridge --network students-skill-tracker-2_default \
  -p 3000:3000 alpine/socat tcp-listen:3000,fork,reuseaddr \
  tcp-connect:students-skill-tracker-2-server-1:3000
```
Запустить dev: `cd client-vue && npm run dev`. Войти как админ (`teacher@gmail.com` / `admin1`). Проверить:
- `/profile` для админа редиректит на `/admin`; страница «Кабинет преподавателя» показывает группы и студентов;
- аккордеон раскрывается по клику; видны тесты студента (итог + оценка по **админской** шкале) и файлы;
- скачивание файла студента работает; удаление файла (confirm) убирает его и обновляет индикатор;
- удаление пользователя (confirm) → уведомление → перезагрузка;
- на странице темы (`/topic?topicId=1`) у админа есть «Редактировать» → CKEditor с текущим контентом → «Сохранить» (PUT) обновляет просмотр; «Отмена» возвращает без изменений; у обычного пользователя кнопки нет.
Сверить со старым клиентом. Остановить dev и `docker stop vite-api-bridge`.

- [ ] **Step 3: Финальный коммит (если сверка потребовала правок — иначе пропустить)**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "fix: pravki po itogam sverki Etapa 6"
```

---

## Definition of Done (Этап 6)

- [ ] `test:unit` зелёный (api/admin, utils/adminFormat + накопленные).
- [ ] `type-check`, `build`, `lint` — без ошибок.
- [ ] `/admin` показывает группы и студентов (аккордеон), тесты с оценкой по админской шкале, файлы.
- [ ] Файлы студента: скачивание и удаление (confirm) работают; индикатор файлов обновляется.
- [ ] Удаление пользователя (confirm) работает, после успеха — перезагрузка.
- [ ] Страница темы: админ видит «Редактировать», правит в CKEditor, сохраняет (PUT /topics/:id/content) и отменяет; обычный пользователь кнопок не видит.
- [ ] Маршрут `/admin` → `AdminView`; гард `/profile`→`/admin` для админа работает (Этап 1).
- [ ] Все коммиты локально в `feat/vue-rewrite`; `client/` и `server/` не тронуты; на GitHub не запушено.
```
