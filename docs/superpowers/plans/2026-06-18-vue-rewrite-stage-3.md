# Этап 3: Личный кабинет (Profile) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести страницу личного кабинета на Vue: данные пользователя с инлайн-редактированием, первичная форма ФИО/группы, секция файлов (загрузка/список/скачивание/удаление через S3-эндпоинты), история результатов тестов — поведение 1-в-1.

**Architecture:** Расширяем `api/users.ts` методами профиля/результатов/файлов (с типами). `ProfileView.vue` загружает данные и оркеструет дочерние компоненты `components/profile/*` (UserDataSection, ProfileSetupForm, FilesSection, TestResultsSection). Обратная связь — через стор уведомлений из Этапа 2. Логика (валидация группы, формат размера файла) — юнит-тесты; формы — компонентные тесты.

**Tech Stack:** Vue 3 `<script setup>` + TS, Pinia, Vitest + @vue/test-utils, Bootstrap 5.

## Global Constraints

- Весь код — в `client-vue/`. `client/` и `server/` НЕ менять.
- Имена компонентов многословные: `ProfileView`, `UserDataSection`, `ProfileSetupForm`, `FilesSection`, `TestResultsSection`.
- Точная копия поведения и вёрстки; CSS переносим **дословно** в `assets/pages/profile/`.
- Эндпоинты: профиль `PUT /users/profile`; результаты `GET /test-results`; файлы `POST /upload`, `GET /upload/files`, `DELETE /upload/delete/:key`, `GET /upload/download/:key`.
- Формат группы: `/^(?:\d-\d{2}|\d{2}-\d{2})$/` (X-XX или XX-XX); пустая группа допустима.
- Ветка `feat/vue-rewrite`, коммиты только локально, на GitHub НЕ пушим.
- В конце каждой задачи: `test:unit`, `type-check`, `build`, `lint` — зелёные.

## Перенос (соответствие старому коду)

| Старое (`client/src/...`) | Новое (`client-vue/src/...`) |
|---|---|
| `userService.js` (updateProfile/getTestResults/файлы) | `api/users.ts` (расширяем) |
| `Profile/helpers.js` (formatFileSize) | `utils/format.ts` |
| `Profile/profileForm.js` (валидация группы) | `api/validation.ts` (расширяем) + `ProfileSetupForm.vue` |
| `Profile/userDataSection.js` | `components/profile/UserDataSection.vue` |
| `Profile/filesSection.js` | `components/profile/FilesSection.vue` |
| `Profile/testResultsSection.js` | `components/profile/TestResultsSection.vue` |
| `Profile/alerts.js` | стор уведомлений (Этап 2) |
| `Profile/ProfilePage.js` | `views/ProfileView.vue` |

> `escapeHtml` не нужен — шаблоны Vue экранируют по умолчанию.

---

## Task 1: Хелперы профиля — валидация группы и формат размера (TDD)

**Files:**
- Modify: `client-vue/src/api/validation.ts`
- Modify: `client-vue/src/api/validation.spec.ts`
- Create: `client-vue/src/utils/format.ts`
- Create: `client-vue/src/utils/format.spec.ts`

**Interfaces:**
- Produces:
  - `validateGroupNumber(group: string): string | null`
  - `formatFileSize(bytes: number): string`

- [ ] **Step 1: Дописать падающие тесты в `client-vue/src/api/validation.spec.ts`**

Добавить импорт `validateGroupNumber` и новый блок:
```ts
import { validateEmail, validatePassword, validateLoginInput, validateGroupNumber } from './validation'

describe('validateGroupNumber', () => {
  it('пустая группа допустима', () => {
    expect(validateGroupNumber('')).toBeNull()
  })
  it('корректные форматы X-XX и XX-XX', () => {
    expect(validateGroupNumber('1-23')).toBeNull()
    expect(validateGroupNumber('12-34')).toBeNull()
  })
  it('некорректный формат даёт ошибку', () => {
    expect(validateGroupNumber('123')).toMatch(/формат/i)
    expect(validateGroupNumber('1-2')).toMatch(/формат/i)
  })
})
```

- [ ] **Step 2: Написать падающий тест `client-vue/src/utils/format.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { formatFileSize } from './format'

describe('formatFileSize', () => {
  it('0 байт', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
  })
  it('килобайты и мегабайты', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1048576)).toBe('1 MB')
  })
})
```

- [ ] **Step 3: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- validation format
```
Ожидаемо: FAIL (нет `validateGroupNumber` и модуля format).

- [ ] **Step 4: Дописать `validateGroupNumber` в `client-vue/src/api/validation.ts`**

```ts
const GROUP_RE = /^(?:\d-\d{2}|\d{2}-\d{2})$/

export function validateGroupNumber(group: string): string | null {
  if (group && !GROUP_RE.test(group)) return 'Номер группы должен быть в формате X-XX или XX-XX'
  return null
}
```

- [ ] **Step 5: Создать `client-vue/src/utils/format.ts`**

```ts
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
```

- [ ] **Step 6: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- validation format
```
Ожидаемо: PASS.

- [ ] **Step 7: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: валидация группы и formatFileSize с тестами"
```

---

## Task 2: API — профиль и результаты тестов (TDD)

**Files:**
- Modify: `client-vue/src/api/types.ts`
- Modify: `client-vue/src/api/users.ts`
- Create: `client-vue/src/api/users.spec.ts`

**Interfaces:**
- Consumes: `http`, `getToken/removeToken`, `isAuthError`.
- Produces:
  - `updateProfile(fullName: string, groupNumber: string): Promise<UpdateProfileResult>`
  - `getTestResults(): Promise<TestResultsResult>`
  - типы `TestResult`, `UpdateProfileResult`, `TestResultsResult`.

- [ ] **Step 1: Добавить типы в `client-vue/src/api/types.ts`**

```ts
export interface TestResult {
  test_title?: string
  test_code?: string
  completed_at: string
  grade?: number | string
}

export interface UpdateProfileResult {
  success: boolean
  user?: User
  error?: string
}

export interface TestResultsResult {
  success: boolean
  results: TestResult[]
  error?: string
}
```

- [ ] **Step 2: Написать падающий тест `client-vue/src/api/users.spec.ts`**

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getTestResults } from './users'
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

describe('getTestResults', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('без токена возвращает success: false и пустой список', async () => {
    const res = await getTestResults()
    expect(res.success).toBe(false)
    expect(res.results).toEqual([])
  })

  it('с токеном возвращает список результатов', async () => {
    setToken('tok')
    vi.stubGlobal('fetch', mockFetchJson({ results: [{ completed_at: '2026-01-01', grade: 9 }] }))
    const res = await getTestResults()
    expect(res.success).toBe(true)
    expect(res.results).toHaveLength(1)
  })
})
```

- [ ] **Step 3: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- users.spec
```
Ожидаемо: FAIL (нет `getTestResults`).

- [ ] **Step 4: Дописать методы в `client-vue/src/api/users.ts`**

Добавить импорты типов и две функции (рядом с `getCurrentUser`):
```ts
import type {
  CurrentUserResult,
  TestResult,
  TestResultsResult,
  UpdateProfileResult,
  User,
} from './types'

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
```
> Существующий импорт `import type { CurrentUserResult, User } from './types'` заменить на расширенный (выше), чтобы не дублировать.

- [ ] **Step 5: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- users.spec
```
Ожидаемо: PASS.

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: api updateProfile и getTestResults с тестами"
```

---

## Task 3: API — файлы (TDD)

**Files:**
- Modify: `client-vue/src/api/types.ts`
- Modify: `client-vue/src/api/users.ts`
- Modify: `client-vue/src/api/users.spec.ts`

**Interfaces:**
- Produces:
  - `getUserFiles(): Promise<FilesResult>`
  - `uploadFile(file: File): Promise<UploadResult>`
  - `deleteFile(key: string): Promise<DeleteResult>`
  - `getDownloadUrl(key: string): Promise<DownloadUrlResult>`
  - типы `UserFile`, `FilesResult`, `UploadResult`, `DeleteResult`, `DownloadUrlResult`.

- [ ] **Step 1: Добавить типы в `client-vue/src/api/types.ts`**

```ts
export interface UserFile {
  key: string
  fileName: string
  size: number
  lastModified: string
}

export interface FilesResult {
  success: boolean
  files: UserFile[]
  error?: string
}

export interface UploadResult {
  success: boolean
  data?: unknown
  error?: string
}

export interface DeleteResult {
  success: boolean
  message?: string
  error?: string
}

export interface DownloadUrlResult {
  success: boolean
  url?: string
  error?: string
}
```

- [ ] **Step 2: Дописать падающий тест в `client-vue/src/api/users.spec.ts`**

Добавить импорт `getUserFiles` и блок:
```ts
describe('getUserFiles', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('без токена — success: false, пустой список', async () => {
    const res = await getUserFiles()
    expect(res.success).toBe(false)
    expect(res.files).toEqual([])
  })

  it('с токеном возвращает файлы', async () => {
    setToken('tok')
    vi.stubGlobal(
      'fetch',
      mockFetchJson({ files: [{ key: 'k', fileName: 'a.pdf', size: 10, lastModified: '2026-01-01' }] }),
    )
    const res = await getUserFiles()
    expect(res.success).toBe(true)
    expect(res.files[0].fileName).toBe('a.pdf')
  })
})
```

- [ ] **Step 3: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- users.spec
```
Ожидаемо: FAIL (нет `getUserFiles`).

- [ ] **Step 4: Дописать файловые методы в `client-vue/src/api/users.ts`**

Расширить импорт типов (добавить `DeleteResult, DownloadUrlResult, FilesResult, UploadResult`) и добавить функции:
```ts
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
```

- [ ] **Step 5: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- users.spec
```
Ожидаемо: PASS.

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: api файлов (upload/list/delete/download) с тестами"
```

---

## Task 4: Секция результатов тестов

**Files:**
- Create: `client-vue/src/components/profile/TestResultsSection.vue`

**Interfaces:**
- Consumes: тип `TestResultsResult`.
- Produces: `TestResultsSection` с prop `results: TestResultsResult`.

- [ ] **Step 1: Создать `client-vue/src/components/profile/TestResultsSection.vue`**

```vue
<script setup lang="ts">
import type { TestResult, TestResultsResult } from '@/api/types'

const props = defineProps<{ results: TestResultsResult }>()

function testTitle(t: TestResult): string {
  return t.test_title || t.test_code || ''
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU')
}
</script>

<template>
  <div class="test-results-section">
    <h3>Ваши результаты</h3>
    <div v-if="!props.results.success" class="alert alert-warning" role="alert">
      Ошибка загрузки результатов: {{ props.results.error }}
    </div>
    <div v-else-if="props.results.results.length === 0" class="alert alert-info" role="alert">
      Нет пройденных тестов
    </div>
    <div v-else class="test-results-list">
      <div v-for="(result, i) in props.results.results" :key="i" class="test-result-item">
        <div class="result-header">
          <span class="test-title">Вы прошли тест {{ testTitle(result) }}</span>
          <span class="test-date">{{ formatDate(result.completed_at) }}</span>
        </div>
        <div class="result-score">
          <span class="score">Оценка: {{ result.grade ?? '-' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Проверить сборку**

```bash
cd client-vue && npm run build
```
Ожидаемо: без ошибок (стили подключим в Task 8).

- [ ] **Step 3: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: TestResultsSection"
```

---

## Task 5: Данные пользователя и первичная форма

**Files:**
- Create: `client-vue/src/components/profile/UserDataSection.vue`
- Create: `client-vue/src/components/profile/ProfileSetupForm.vue`
- Create: `client-vue/src/components/profile/ProfileSetupForm.spec.ts`

**Interfaces:**
- Consumes: `useNotificationStore`, `validateGroupNumber`, `updateProfile`, `getErrorMessage`, тип `User`.
- Produces:
  - `UserDataSection` — prop `user: User`, emit `updated` (после сохранения поля).
  - `ProfileSetupForm` — emit `saved` (после успешного первичного сохранения).

- [ ] **Step 1: Создать `client-vue/src/components/profile/ProfileSetupForm.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { validateGroupNumber } from '@/api/validation'
import { updateProfile } from '@/api/users'
import { getErrorMessage } from '@/api/errors'

const emit = defineEmits<{ (e: 'saved'): void }>()
const notify = useNotificationStore()

const fullName = ref('')
const groupNumber = ref('')
const saving = ref(false)

async function onSubmit(): Promise<void> {
  const name = fullName.value.trim()
  const group = groupNumber.value.trim()
  const groupError = validateGroupNumber(group)
  if (groupError) {
    notify.warning(groupError)
    return
  }
  saving.value = true
  try {
    const result = await updateProfile(name, group)
    if (result.success) {
      notify.success('Данные успешно сохранены!')
      emit('saved')
    } else {
      notify.error('Ошибка при сохранении: ' + getErrorMessage(result))
    }
  } catch (error) {
    notify.error('Ошибка при сохранении: ' + getErrorMessage(error))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="profile-form" @submit.prevent="onSubmit">
    <div class="row g-3">
      <div class="col-md-8 col-lg-8">
        <label for="fullName" class="form-label">Фамилия и Имя:</label>
        <input
          v-model="fullName"
          type="text"
          class="form-control"
          id="fullName"
          name="fullName"
          placeholder="Введите ваши фамилию и имя"
        />
      </div>
      <div class="col-md-4 col-lg-4">
        <label for="groupNumber" class="form-label">Номер группы:</label>
        <input
          v-model="groupNumber"
          type="text"
          class="form-control"
          id="groupNumber"
          name="groupNumber"
          placeholder="Введите номер группы"
        />
      </div>
    </div>
    <div class="mt-3 text-center">
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </div>
  </form>
</template>
```

- [ ] **Step 2: Создать `client-vue/src/components/profile/UserDataSection.vue`**

Инлайн-редактирование каждого поля через режим правки (input + Сохранить/Отмена), как в старом userDataSection, но без `contenteditable`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { validateGroupNumber } from '@/api/validation'
import { updateProfile, getCurrentUser } from '@/api/users'
import { getErrorMessage } from '@/api/errors'
import type { User } from '@/api/types'

const props = defineProps<{ user: User }>()
const emit = defineEmits<{ (e: 'updated'): void }>()
const notify = useNotificationStore()

type Field = 'fullName' | 'groupNumber'

const editing = ref<Field | null>(null)
const draft = ref('')
const saving = ref(false)

function startEdit(field: Field): void {
  editing.value = field
  draft.value = String(props.user[field] ?? '')
}

function cancelEdit(): void {
  editing.value = null
  draft.value = ''
}

async function saveEdit(field: Field): Promise<void> {
  const newValue = draft.value.trim()
  const original = String(props.user[field] ?? '')
  if (newValue === original) {
    cancelEdit()
    return
  }
  if (!newValue) {
    notify.warning(`${field === 'fullName' ? 'Фамилия и Имя' : 'Номер группы'} не может быть пустым`)
    return
  }
  if (field === 'groupNumber') {
    const groupError = validateGroupNumber(newValue)
    if (groupError) {
      notify.warning(groupError)
      return
    }
  }
  saving.value = true
  try {
    const current = await getCurrentUser()
    if (!current.success || !current.user) {
      throw new Error('Не удалось загрузить текущие данные пользователя')
    }
    const fullName = field === 'fullName' ? newValue : current.user.fullName || ''
    const groupNumber = field === 'groupNumber' ? newValue : current.user.groupNumber || ''
    const result = await updateProfile(fullName, groupNumber)
    if (result.success) {
      notify.success('Данные успешно сохранены!')
      editing.value = null
      emit('updated')
    } else {
      notify.error('Ошибка при сохранении: ' + getErrorMessage(result))
    }
  } catch (error) {
    notify.error('Ошибка при сохранении: ' + getErrorMessage(error))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="props.user.fullName || props.user.groupNumber" class="user-data-section">
    <h3>Ваши данные:</h3>
    <div class="user-data">
      <div class="data-item">
        <span class="data-label">Email:</span>
        <span class="data-value">{{ props.user.email }}</span>
      </div>

      <div v-if="props.user.fullName" class="data-item editable-item" data-field="fullName">
        <span class="data-label">Фамилия и Имя:</span>
        <template v-if="editing === 'fullName'">
          <input v-model="draft" class="data-value editable-field editing" />
          <button class="save-btn-field" :disabled="saving" @click="saveEdit('fullName')">
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
          <button class="cancel-btn-field" :disabled="saving" @click="cancelEdit">Отмена</button>
        </template>
        <template v-else>
          <span class="data-value">{{ props.user.fullName }}</span>
          <button class="edit-btn" @click="startEdit('fullName')">Редактировать</button>
        </template>
      </div>

      <div v-if="props.user.groupNumber" class="data-item editable-item" data-field="groupNumber">
        <span class="data-label">Номер группы:</span>
        <template v-if="editing === 'groupNumber'">
          <input v-model="draft" class="data-value editable-field editing" />
          <button class="save-btn-field" :disabled="saving" @click="saveEdit('groupNumber')">
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
          <button class="cancel-btn-field" :disabled="saving" @click="cancelEdit">Отмена</button>
        </template>
        <template v-else>
          <span class="data-value">{{ props.user.groupNumber }}</span>
          <button class="edit-btn" @click="startEdit('groupNumber')">Редактировать</button>
        </template>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Написать компонентный тест `client-vue/src/components/profile/ProfileSetupForm.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProfileSetupForm from './ProfileSetupForm.vue'
import { useNotificationStore } from '@/stores/notifications'

describe('ProfileSetupForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('некорректный формат группы показывает предупреждение и не сохраняет', async () => {
    const wrapper = mount(ProfileSetupForm)
    await wrapper.get('#groupNumber').setValue('123')
    await wrapper.get('form').trigger('submit')
    const notify = useNotificationStore()
    expect(notify.items.length).toBeGreaterThan(0)
    expect(notify.items[0].message).toMatch(/формат/i)
  })
})
```

- [ ] **Step 4: Запустить тест — проходит**

```bash
cd client-vue && npm run test:unit -- ProfileSetupForm
```
Ожидаемо: PASS (валидация срабатывает до сетевого вызова).

- [ ] **Step 5: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: всё зелёное.

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: UserDataSection и ProfileSetupForm с тестом"
```

---

## Task 6: Секция файлов

**Files:**
- Create: `client-vue/src/components/profile/FilesSection.vue`

**Interfaces:**
- Consumes: `getUserFiles`, `uploadFile`, `deleteFile`, `getDownloadUrl`, `formatFileSize`, `useNotificationStore`, тип `UserFile`.
- Produces: `FilesSection` (самостоятельно грузит и обновляет список).

- [ ] **Step 1: Создать `client-vue/src/components/profile/FilesSection.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { getUserFiles, uploadFile, deleteFile, getDownloadUrl } from '@/api/users'
import { getErrorMessage } from '@/api/errors'
import { formatFileSize } from '@/utils/format'
import type { UserFile } from '@/api/types'

const notify = useNotificationStore()
const files = ref<UserFile[]>([])
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

async function loadFiles(): Promise<void> {
  const result = await getUserFiles()
  files.value = result.success ? result.files : []
}

onMounted(loadFiles)

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU')
}

async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const result = await uploadFile(file)
    if (result.success) {
      notify.success('Файл успешно загружен!')
      await loadFiles()
    } else {
      notify.error('Ошибка при загрузке файла: ' + (result.error || 'Неизвестная ошибка'))
    }
  } catch (error) {
    notify.error('Ошибка при загрузке файла: ' + getErrorMessage(error))
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function onDownload(file: UserFile): Promise<void> {
  try {
    const result = await getDownloadUrl(file.key)
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
  }
}

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

async function onDelete(file: UserFile): Promise<void> {
  if (!confirm('Вы уверены, что хотите удалить этот файл?')) return
  try {
    const result = await deleteFile(file.key)
    if (result.success) {
      notify.success('Файл успешно удален!')
      await loadFiles()
    } else {
      notify.error('Ошибка при удалении файла: ' + (result.error || 'Неизвестная ошибка'))
    }
  } catch (error) {
    notify.error('Ошибка при удалении файла: ' + getErrorMessage(error))
  }
}
</script>

<template>
  <div class="files-section">
    <h3>Мои файлы</h3>
    <div class="upload-area">
      <input
        ref="fileInput"
        type="file"
        id="file-input"
        class="file-input"
        accept="image/*,application/pdf,.doc,.docx,.txt,.docs,.xls,.xlsx,.ppt,.pptx"
        @change="onFileChange"
      />
      <label for="file-input" class="upload-btn" :class="{ disabled: uploading }">
        <span class="upload-icon">📁</span>
        <span class="upload-text">{{
          uploading ? 'Загрузка...' : 'Выберите файл для загрузки'
        }}</span>
      </label>
      <div class="upload-info">
        <small
          >Максимальный размер: 10 MB. Разрешенные форматы: изображения, PDF, документы Word (.doc,
          .docx, .docs), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), текстовые файлы
          (.txt)</small
        >
      </div>
    </div>

    <div v-if="files.length === 0" class="files-list empty">
      <p>Нет загруженных файлов</p>
    </div>
    <div v-else class="files-list">
      <div v-for="file in files" :key="file.key" class="file-item" :data-key="file.key">
        <div class="file-info">
          <span class="file-name">{{ file.fileName }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
          <span class="file-date">{{ formatDate(file.lastModified) }}</span>
        </div>
        <div class="file-actions">
          <a href="#" class="file-download" title="Скачать" @click.prevent="onDownload(file)">⬇️</a>
          <button type="button" class="file-delete" title="Удалить" @click="onDelete(file)">
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: всё зелёное.

- [ ] **Step 3: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: FilesSection (загрузка/список/скачивание/удаление)"
```

---

## Task 7: ProfileView, стили, маршрут, финальная проверка

**Files:**
- Create: `client-vue/src/views/ProfileView.vue`
- Create: `client-vue/src/assets/pages/profile/*.css` (копии из `client/`)
- Modify: `client-vue/src/router/index.ts` (profile → ProfileView)
- Modify: `client-vue/src/main.ts` (импорт CSS профиля)

**Interfaces:**
- Consumes: `getCurrentUser`, `getTestResults`, секции профиля.
- Produces: `ProfileView` (загрузка данных + оркестрация секций).

- [ ] **Step 1: Скопировать CSS профиля**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && mkdir -p client-vue/src/assets/pages/profile && \
cp client/src/pages/Profile/ProfilePage.css client-vue/src/assets/pages/profile/profile.css && \
cp client/src/pages/Profile/profileForm.css client-vue/src/assets/pages/profile/profile-form.css && \
cp client/src/pages/Profile/userDataSection.css client-vue/src/assets/pages/profile/user-data.css && \
cp client/src/pages/Profile/filesSection.css client-vue/src/assets/pages/profile/files.css && \
cp client/src/pages/Profile/testResultsSection.css client-vue/src/assets/pages/profile/test-results.css && \
echo ok && ls client-vue/src/assets/pages/profile
```

- [ ] **Step 2: Создать `client-vue/src/views/ProfileView.vue`**

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCurrentUser, getTestResults } from '@/api/users'
import type { TestResultsResult, User } from '@/api/types'
import ProfileSetupForm from '@/components/profile/ProfileSetupForm.vue'
import UserDataSection from '@/components/profile/UserDataSection.vue'
import FilesSection from '@/components/profile/FilesSection.vue'
import TestResultsSection from '@/components/profile/TestResultsSection.vue'

const title = 'Добро пожаловать в Ваш личный кабинет'
const user = ref<User | null>(null)
const results = ref<TestResultsResult>({ success: true, results: [] })
const loadError = ref('')

const hasUserData = computed(() => !!(user.value?.fullName && user.value?.groupNumber))

async function loadUser(): Promise<void> {
  const result = await getCurrentUser()
  if (result.success && result.user) {
    user.value = result.user
    loadError.value = ''
  } else {
    loadError.value = result.error || 'Не удалось загрузить информацию о пользователе'
  }
}

onMounted(async () => {
  await loadUser()
  results.value = await getTestResults()
})
</script>

<template>
  <main id="profile" class="container my-4 profile">
    <h1>{{ title }}</h1>
    <section>
      <div class="profile-container">
        <div v-if="loadError" class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Ошибка загрузки данных</h4>
          <p>Не удалось загрузить информацию о пользователе: {{ loadError }}</p>
        </div>
        <template v-else-if="user">
          <ProfileSetupForm v-if="!hasUserData" @saved="loadUser" />
          <UserDataSection :user="user" @updated="loadUser" />
          <FilesSection />
          <TestResultsSection :results="results" />
        </template>
      </div>
    </section>
  </main>
</template>
```

- [ ] **Step 3: Подключить CSS в `client-vue/src/main.ts`**

Добавить рядом с другими страничными импортами:
```ts
import '@/assets/pages/profile/profile.css'
import '@/assets/pages/profile/profile-form.css'
import '@/assets/pages/profile/user-data.css'
import '@/assets/pages/profile/files.css'
import '@/assets/pages/profile/test-results.css'
```

- [ ] **Step 4: Переключить маршрут `profile` в `client-vue/src/router/index.ts`**

Добавить импорт `import ProfileView from '@/views/ProfileView.vue'` и в маршруте `profile` заменить `component: PlaceholderView` на `ProfileView` (meta/title без изменений; admin-редирект уже в guard).

- [ ] **Step 5: Полный прогон**

```bash
cd client-vue && npm run test:unit && npm run type-check && npm run build && npm run lint
```
Ожидаемо: все тесты зелёные, без ошибок.

- [ ] **Step 6: Ручная сверка (dev-сервер, нужен сервер на :3000)**

```bash
cd client-vue && npm run dev
```
Войти, открыть `/profile`, сравнить со старым клиентом: первичная форма (если нет ФИО/группы), данные с инлайн-редактированием (Редактировать/Сохранить/Отмена, валидация группы), загрузка/скачивание/удаление файла, список результатов. Остановить сервер.

- [ ] **Step 7: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: ProfileView, стили профиля и маршрут"
```

---

## Definition of Done (Этап 3)

- [ ] `test:unit` зелёный (validateGroupNumber, formatFileSize, api users, ProfileSetupForm + ранее накопленные).
- [ ] `type-check`, `build`, `lint` — без ошибок.
- [ ] Профиль: первичная форма ФИО/группы; инлайн-редактирование полей с валидацией группы; секция файлов (загрузка/список/скачивание/удаление); история результатов.
- [ ] Обратная связь — через тосты; ошибки загрузки профиля отображаются.
- [ ] Маршрут `/profile` → ProfileView; админ по-прежнему редиректится на `/admin` (guard).
- [ ] Все коммиты локально в `feat/vue-rewrite`; `client/` и `server/` не тронуты; на GitHub не запушено.
```
