# Этап 2: Простые и публичные страницы — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести страницы Login, About, Contacts, Criteria, 404 на Vue с вёрсткой и поведением 1-в-1, плюс базовую UI-инфраструктуру (уведомления-тосты, валидация, SuccessModal, «голый» layout для Login).

**Architecture:** Презентационные страницы — `views/*.vue` со scoped/перенесённым CSS. Login — форма с логикой (валидация, показ пароля, вход/регистрация, модалка успеха) на полноэкранном layout без Header/Menu/Footer. Уведомления — Pinia-стор `notifications` + компонент `AppNotifications` (порт `errorHandler.showNotification`).

**Tech Stack:** Vue 3 `<script setup>` + TS, Vue Router 4, Pinia 3, Vitest + @vue/test-utils, Bootstrap 5.

## Global Constraints

- Весь код — в `client-vue/`. `client/` и `server/` НЕ менять.
- Имена компонентов многословные. Страницы — `LoginView`, `AboutView`, `ContactsView`, `CriteriaView`, `NotFoundView` (последний уже существует — наполняем).
- Точная копия вёрстки и поведения. CSS переносим из старых файлов **дословно** (в `assets/pages/`).
- Ветка `feat/vue-rewrite`, коммиты только локально, на GitHub НЕ пушим.
- В конце каждой задачи: `npm run test:unit`, `type-check`, `build`, `lint` — зелёные.
- Принцип тестов из спецификации: логика (валидация, стор уведомлений) — юнит-тесты; LoginView — компонентный тест на валидацию; статичные страницы — без детальных тестов.

## Перенос (соответствие старому коду)

| Старое (`client/src/...`) | Новое (`client-vue/src/...`) |
|---|---|
| `services/authCore.js` (validateInput/Email/Password) | `api/validation.ts` |
| `services/errorHandler.js` (showNotification) | `stores/notifications.ts` + `components/ui/AppNotifications.vue` |
| `components/modals/SuccessModal.js` + `common/Modal.css` | `components/ui/SuccessModal.vue` + `assets/ui/modal.css` |
| `pages/LoginPage/LoginPage.js` + `.css` | `views/LoginView.vue` + `assets/pages/login.css` |
| `pages/About/About.js` + `.css` | `views/AboutView.vue` + `assets/pages/about.css` |
| `pages/Contacts/Contacts.js` + `.css` | `views/ContactsView.vue` + `assets/pages/contacts.css` |
| `pages/Criteria/Criteria.js` + `.css` | `views/CriteriaView.vue` + `assets/pages/criteria.css` |
| `pages/Error404/Error404.js` | `views/NotFoundView.vue` (обновляем) |

---

## Task 1: Валидация форм (TDD)

**Files:**
- Create: `client-vue/src/api/validation.ts`
- Create: `client-vue/src/api/validation.spec.ts`

**Interfaces:**
- Produces:
  - `validateEmail(email: string): string | null`
  - `validatePassword(password: string): string | null`
  - `validateLoginInput(email: string, password: string): string | null`

- [ ] **Step 1: Написать падающий тест `client-vue/src/api/validation.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, validateLoginInput } from './validation'

describe('validation', () => {
  it('пустой/некорректный email даёт ошибку', () => {
    expect(validateEmail('')).toMatch(/email/i)
    expect(validateEmail('abc')).toMatch(/email/i)
    expect(validateEmail('a@b.c')).toBeNull()
  })
  it('пустой пароль даёт ошибку', () => {
    expect(validatePassword('')).toMatch(/пароль/i)
    expect(validatePassword('123')).toBeNull()
  })
  it('validateLoginInput возвращает первую ошибку или null', () => {
    expect(validateLoginInput('bad', '123')).toMatch(/email/i)
    expect(validateLoginInput('a@b.c', '')).toMatch(/пароль/i)
    expect(validateLoginInput('a@b.c', '123')).toBeNull()
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- validation
```
Ожидаемо: FAIL (модуль не найден).

- [ ] **Step 3: Создать `client-vue/src/api/validation.ts`**

```ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  if (!email || !EMAIL_RE.test(email)) return 'Введите корректный email адрес'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Введите пароль'
  return null
}

export function validateLoginInput(email: string, password: string): string | null {
  return validateEmail(email) || validatePassword(password) || null
}
```

- [ ] **Step 4: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- validation
```
Ожидаемо: PASS.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: api/validation (формы) с тестами"
```

---

## Task 2: Уведомления-тосты (стор + компонент, TDD стора)

**Files:**
- Create: `client-vue/src/stores/notifications.ts`
- Create: `client-vue/src/stores/notifications.spec.ts`
- Create: `client-vue/src/components/ui/AppNotifications.vue`

**Interfaces:**
- Produces:
  - `useNotificationStore` с `items: Notification[]`, действиями `notify(message, type?, duration?)`, `remove(id)`, `error/success/warning/info`.
  - `interface Notification { id: number; message: string; type: 'danger' | 'success' | 'warning' | 'info' }`
  - Компонент `AppNotifications` (рендерит активные уведомления сверху по центру).

- [ ] **Step 1: Написать падающий тест `client-vue/src/stores/notifications.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from './notifications'

describe('useNotificationStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('notify добавляет уведомление и возвращает id', () => {
    const store = useNotificationStore()
    const id = store.notify('Ошибка', 'danger', 0)
    expect(store.items).toHaveLength(1)
    expect(store.items[0]).toMatchObject({ id, message: 'Ошибка', type: 'danger' })
  })

  it('remove удаляет по id', () => {
    const store = useNotificationStore()
    const id = store.notify('x', 'info', 0)
    store.remove(id)
    expect(store.items).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- notifications
```
Ожидаемо: FAIL.

- [ ] **Step 3: Создать `client-vue/src/stores/notifications.ts`**

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'danger' | 'success' | 'warning' | 'info'

export interface Notification {
  id: number
  message: string
  type: NotificationType
}

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([])
  let nextId = 0

  function remove(id: number): void {
    items.value = items.value.filter((n) => n.id !== id)
  }

  function notify(message: string, type: NotificationType = 'danger', duration = 5000): number {
    const id = nextId++
    items.value.push({ id, message, type })
    if (duration > 0) setTimeout(() => remove(id), duration)
    return id
  }

  const error = (message: string, duration?: number) => notify(message, 'danger', duration)
  const success = (message: string, duration?: number) => notify(message, 'success', duration)
  const warning = (message: string, duration?: number) => notify(message, 'warning', duration)
  const info = (message: string, duration?: number) => notify(message, 'info', duration)

  return { items, notify, remove, error, success, warning, info }
})
```

- [ ] **Step 4: Создать `client-vue/src/components/ui/AppNotifications.vue`**

```vue
<script setup lang="ts">
import { useNotificationStore } from '@/stores/notifications'
const store = useNotificationStore()
</script>

<template>
  <div
    v-for="item in store.items"
    :key="item.id"
    class="error-handler-alert-container position-fixed top-0 start-50 translate-middle-x mt-3 error-handler-alert-z-index"
  >
    <div :class="`alert alert-${item.type} alert-dismissible fade show`" role="alert">
      {{ item.message }}
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        @click="store.remove(item.id)"
      ></button>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Запустить тесты стора — проходят**

```bash
cd client-vue && npm run test:unit -- notifications
```
Ожидаемо: PASS.

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: стор и компонент уведомлений (тосты)"
```

---

## Task 3: SuccessModal + стили модалок + фон

**Files:**
- Create: `client-vue/src/assets/background.jpg` (копия из `client/`)
- Create: `client-vue/src/assets/ui/modal.css` (копия `client/src/common/Modal.css`)
- Create: `client-vue/src/components/ui/SuccessModal.vue`

**Interfaces:**
- Produces: компонент `SuccessModal` с props `title`, `message`, `buttonText`; emits `confirm`, `close`; управляется `v-if` снаружи.

- [ ] **Step 1: Скопировать фон и стили модалок**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && \
cp client/src/assets/background.jpg client-vue/src/assets/background.jpg && \
mkdir -p client-vue/src/assets/ui && \
cp client/src/common/Modal.css client-vue/src/assets/ui/modal.css && \
echo "ok" && ls client-vue/src/assets/ui
```

- [ ] **Step 2: Создать `client-vue/src/components/ui/SuccessModal.vue`**

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import background from '@/assets/background.jpg'

withDefaults(
  defineProps<{
    title?: string
    message?: string
    buttonText?: string
  }>(),
  {
    title: 'Успешно!',
    message: 'Операция выполнена успешно',
    buttonText: 'Понятно',
  },
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()

onMounted(() => {
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  document.body.style.overflow = 'auto'
})
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div
      class="modal-content success-modal-content"
      :style="{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }"
    >
      <button class="close-button" @click="emit('close')">×</button>
      <div class="success-icon">✓</div>
      <h3 class="success-title">{{ title }}</h3>
      <div class="modal-body success-modal-body">
        <p class="success-message">{{ message }}</p>
      </div>
      <button class="action-button success-action-button" @click="emit('confirm')">
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Проверить сборку**

```bash
cd client-vue && npm run build
```
Ожидаемо: без ошибок (CSS подключим в Task 5/верстке).

- [ ] **Step 4: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: SuccessModal + стили модалок и фон"
```

---

## Task 4: «Голый» layout для Login

**Files:**
- Modify: `client-vue/src/App.vue`
- Modify: `client-vue/src/router/index.ts` (meta.layout у /login)

**Interfaces:**
- Consumes: `AppNotifications` (Task 2).
- Produces: App.vue скрывает Header/Menu/Footer на маршрутах с `meta.layout === 'bare'`; всегда рендерит Loader и Notifications.

- [ ] **Step 1: Заменить содержимое `client-vue/src/App.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppMenu from '@/components/layout/AppMenu.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppLoader from '@/components/layout/AppLoader.vue'
import AppNotifications from '@/components/ui/AppNotifications.vue'

const route = useRoute()
const showChrome = computed(() => route.meta.layout !== 'bare')
</script>

<template>
  <div id="root">
    <AppHeader v-if="showChrome" />
    <AppMenu v-if="showChrome" />
    <RouterView />
    <AppFooter v-if="showChrome" />
    <AppLoader />
    <AppNotifications />
  </div>
</template>
```

- [ ] **Step 2: Добавить `meta.layout: 'bare'` маршруту `/login` в `client-vue/src/router/index.ts`**

Заменить строку маршрута login на:
```ts
    {
      path: '/login',
      name: 'login',
      component: PlaceholderView,
      meta: { title: 'Вход', layout: 'bare' },
    },
```

- [ ] **Step 3: Проверить сборку и типы**

```bash
cd client-vue && npm run type-check && npm run build
```
Ожидаемо: без ошибок.

- [ ] **Step 4: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: голый layout для /login + AppNotifications в каркасе"
```

---

## Task 5: Страница входа (LoginView) + компонентный тест

**Files:**
- Create: `client-vue/src/assets/pages/login.css` (копия `client/src/pages/LoginPage/LoginPage.css`)
- Create: `client-vue/src/views/LoginView.vue`
- Create: `client-vue/src/views/LoginView.spec.ts`
- Modify: `client-vue/src/router/index.ts` (login → LoginView)
- Modify: `client-vue/src/main.ts` (импорт login.css, modal.css)

**Interfaces:**
- Consumes: `useAuthStore`, `useUiStore`, `useNotificationStore`, `validateLoginInput`, `getErrorMessage`, `SuccessModal`, логотип, фон.
- Produces: `LoginView` (вход/регистрация/показ пароля/модалка успеха).

- [ ] **Step 1: Скопировать CSS логина**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && mkdir -p client-vue/src/assets/pages && \
cp client/src/pages/LoginPage/LoginPage.css client-vue/src/assets/pages/login.css && echo ok
```

- [ ] **Step 2: Создать `client-vue/src/views/LoginView.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useNotificationStore } from '@/stores/notifications'
import { validateLoginInput } from '@/api/validation'
import { getErrorMessage } from '@/api/errors'
import { hasValidToken } from '@/api/tokenStorage'
import SuccessModal from '@/components/ui/SuccessModal.vue'
import logo from '@/assets/logo_vgik.png'
import background from '@/assets/background.jpg'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const notify = useNotificationStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const showSuccess = ref(false)

function togglePassword(): void {
  showPassword.value = !showPassword.value
}

function goToApp(): void {
  showSuccess.value = false
  router.push('/')
}

async function handleLogin(): Promise<void> {
  const validationError = validateLoginInput(email.value, password.value)
  if (validationError) {
    notify.error(validationError)
    return
  }
  ui.showLoader()
  try {
    const result = await auth.login(email.value, password.value)
    if (result.success) {
      router.push('/')
    } else {
      notify.error(getErrorMessage(result, 'LoginView.handleLogin'))
    }
  } catch (error) {
    notify.error(getErrorMessage(error, 'LoginView.handleLogin'))
  } finally {
    ui.hideLoader()
  }
}

async function handleRegister(): Promise<void> {
  const validationError = validateLoginInput(email.value, password.value)
  if (validationError) {
    notify.error(validationError)
    return
  }
  ui.showLoader()
  try {
    const result = await auth.register(email.value, password.value)
    if (!result.success) {
      notify.error(getErrorMessage(result, 'LoginView.handleRegister'))
      return
    }
    if (!hasValidToken()) {
      const loginResult = await auth.login(email.value, password.value)
      if (!loginResult.success) {
        notify.error(getErrorMessage(loginResult, 'LoginView.handleRegister.login'))
        return
      }
    }
    if (!auth.isAuthenticated) {
      notify.error('Не удалось сохранить токен авторизации. Попробуйте войти вручную.')
      return
    }
    showSuccess.value = true
    setTimeout(goToApp, 800)
  } catch (error) {
    notify.error(getErrorMessage(error, 'LoginView.handleRegister'))
  } finally {
    ui.hideLoader()
  }
}
</script>

<template>
  <div
    class="page-background"
    :style="{
      backgroundImage: `url(${background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }"
  >
    <div class="main-container">
      <div class="text-section">
        <img :src="logo" alt="Логотип УО ВГИК" class="logo" />
        <h1 class="login-title">
          <span class="login-title-main">Кондитер-Pro</span>
        </h1>
        <p class="login-title-sub login-title-sub--primary">
          Контроль и оценка компетенций обучающихся по учебному предмету "Специальная технология"
        </p>
        <p class="login-title-sub login-title-sub--secondary">
          Специальность: "Обслуживание и изготовление продукции в общественном питании".
          Квалификация: "Кондитер 4 разряда"
        </p>
      </div>
      <div class="login-wrapper">
        <div class="form-box">
          <h2>Вход</h2>
          <form @submit.prevent>
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input
                v-model="email"
                type="email"
                class="form-control"
                id="email"
                placeholder="Введите Ваш email"
                required
              />
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Пароль</label>
              <div class="password-input-wrapper position-relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  id="password"
                  placeholder="******"
                  required
                />
                <button
                  type="button"
                  class="btn btn-link password-toggle-btn position-absolute top-50 end-0 translate-middle-y"
                  :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                  @click="togglePassword"
                >
                  <svg
                    v-if="!showPassword"
                    class="eye-icon eye-closed"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg
                    v-else
                    class="eye-icon eye-open"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>
            <button type="button" class="btn btn-primary w-100 mb-2" @click="handleLogin">
              Войти
            </button>
            <button type="button" class="btn btn-success w-100" @click="handleRegister">
              Зарегистрироваться
            </button>
          </form>
        </div>
      </div>
    </div>
    <SuccessModal
      v-if="showSuccess"
      title="Регистрация прошла успешно!"
      message="Сейчас вы будете перенаправлены в приложение"
      button-text="Перейти"
      @confirm="goToApp"
      @close="goToApp"
    />
  </div>
</template>
```

- [ ] **Step 3: Подключить login.css и modal.css в `client-vue/src/main.ts`**

Добавить две строки импортов рядом с остальными CSS:
```ts
import '@/assets/pages/login.css'
import '@/assets/ui/modal.css'
```

- [ ] **Step 4: Переключить маршрут `/login` на `LoginView` в `client-vue/src/router/index.ts`**

Добавить импорт вверху:
```ts
import LoginView from '@/views/LoginView.vue'
```
И в маршруте login заменить `component: PlaceholderView` на `component: LoginView` (meta оставить с `layout: 'bare'`).

- [ ] **Step 5: Написать компонентный тест `client-vue/src/views/LoginView.spec.ts`**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from './LoginView.vue'
import { useNotificationStore } from '@/stores/notifications'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('при пустых полях показывает уведомление об ошибке и не уходит со страницы', async () => {
    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    await wrapper.get('button.btn-primary').trigger('click')
    const notify = useNotificationStore()
    expect(notify.items.length).toBeGreaterThan(0)
    expect(notify.items[0].message).toMatch(/email/i)
  })
})
```

- [ ] **Step 6: Запустить тест LoginView — проходит**

```bash
cd client-vue && npm run test:unit -- LoginView
```
Ожидаемо: PASS.

- [ ] **Step 7: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: всё зелёное.

- [ ] **Step 8: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: страница входа LoginView с тестом"
```

---

## Task 6: Статичные страницы About и Contacts

**Files:**
- Create: `client-vue/src/assets/pages/about.css` (копия `client/src/pages/About/About.css`)
- Create: `client-vue/src/assets/pages/contacts.css` (копия `client/src/pages/Contacts/Contacts.css`)
- Create: `client-vue/src/assets/about_img/about1.jpg`, `about2.jpg`, `about3.jpg` (копии из `client/`)
- Create: `client-vue/src/views/AboutView.vue`
- Create: `client-vue/src/views/ContactsView.vue`
- Modify: `client-vue/src/router/index.ts` (about → AboutView, contacts → ContactsView)
- Modify: `client-vue/src/main.ts` (импорт about.css, contacts.css)

**Interfaces:**
- Produces: `AboutView`, `ContactsView` (статичный контент).

- [ ] **Step 1: Скопировать CSS и картинки**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && \
cp client/src/pages/About/About.css client-vue/src/assets/pages/about.css && \
cp client/src/pages/Contacts/Contacts.css client-vue/src/assets/pages/contacts.css && \
mkdir -p client-vue/src/assets/about_img && \
cp client/src/assets/about_img/about1.jpg client-vue/src/assets/about_img/about1.jpg && \
cp client/src/assets/about_img/about2.jpg client-vue/src/assets/about_img/about2.jpg && \
cp client/src/assets/about_img/about3.jpg client-vue/src/assets/about_img/about3.jpg && \
echo ok
```

- [ ] **Step 2: Создать `client-vue/src/views/AboutView.vue`**

Шапку `<main class="container my-4">` + `<h1>О проекте</h1>` + `<section>` повторяем как в `common/Page.render`. Внутрь `<section>` — содержимое `content` из `client/src/pages/About/About.js` **дословно**, заменив три `<img src="${aboutN}">` на импортированные ассеты:

```vue
<script setup lang="ts">
import about1 from '@/assets/about_img/about1.jpg'
import about2 from '@/assets/about_img/about2.jpg'
import about3 from '@/assets/about_img/about3.jpg'
</script>

<template>
  <main id="about" class="container my-4">
    <h1>О проекте</h1>
    <section>
      <div class="about-page">
        <h2 class="about-section-title">Цель создания и методическая основа</h2>
        <p>
          Веб-приложение Кондитер-Pro создано на основании сборника заданий и тестовых материалов
          контроля и оценки результатов деятельности, обучающихся по учебному предмету "Специальная
          технология" для специальности "Обслуживание и изготовление продукции в общественном
          питании", квалификация "Кондитер 4 разряда". Сборник разработан преподавателем высшей
          категории Ляховской Анной Егоровной.
        </p>
        <p>
          Цель создания: Автоматизация и повышение эффективности процессов обучения, контроля и
          оценки знаний обучающихся по специальности «Кондитер 4 разряда» на основе современных
          цифровых технологий.
        </p>
        <p>
          Веб-приложение включает все основные темы программы и предлагает различные формы
          тестирования, включая вопросы с выбором ответа, задания на дополнение и установление
          соответствия. Оно разработано для поддержки процесса обучения, контроля и интерактивной
          оценки знаний обучающихся.
        </p>
        <p>
          Помимо заданий для тестирования, в приложении представлены разделы с контрольными вопросами
          и темами проектов, что помогает направить внимание обучающихся на более глубокое изучение
          материала и подготовиться к практическим занятиям и экзаменам. Так же содержатся основы
          теоретического материала по каждой изучаемой теме.
        </p>
        <p>
          Для визуального сопровождения учебного материала в приложении размещено более 300 картинок,
          которые наглядно иллюстрируют основные темы и помогают обучающимся лучше понимать и
          запоминать изучаемые процессы.
        </p>
        <p>
          Платформа предоставляет удобные инструменты для преподавателя и обучающихся: автоматический
          расчет результатов, визуализацию прогресса, а также мгновенную обратную связь по итогам
          тестирования. Обучающиеся могут закреплять знания, проходя тесты по темам, а преподаватель
          имеет возможность объективно оценивать успеваемость и анализировать результаты в динамике.
        </p>
        <p>
          Для обеспечения удобства и прозрачности оценки предусмотрены две шкалы, которые переводят
          баллы в итоговую отметку, что способствует стандартизации системы оценивания и повышает
          эффективность контроля знаний. Для максимального удобства пользователей реализована
          полнофункциональная мобильная версия, обеспечивающая доступ ко всем возможностям приложения
          с любых устройств.
        </p>

        <h2 class="about-section-title">Личный кабинет обучающегося</h2>
        <p>
          Каждый обучающийся имеет доступ к персональному кабинету, который предоставляет широкие
          возможности для управления учебным процессом. В личном кабинете обучающийся может указать и
          редактировать свои данные: фамилию, имя и номер группы. Это позволяет преподавателю легко
          идентифицировать обучающихся и организовывать их по группам для удобного мониторинга
          успеваемости.
        </p>
        <p>
          В кабинете обучающегося отображается полная история прохождения тестов с указанием даты
          прохождения и полученной оценки. Это позволяет отслеживать прогресс и видеть динамику
          улучшения результатов.
        </p>
        <p>
          Дополнительно в личном кабинете реализована система управления файлами. Обучающиеся могут
          загружать свои работы, проекты, конспекты и другие учебные материалы. Поддерживаются
          различные форматы файлов: изображения, PDF-документы, документы Word, Excel, PowerPoint и
          текстовые файлы. Загруженные файлы можно просматривать, скачивать и удалять, что
          обеспечивает удобное хранение и организацию учебных материалов в одном месте.
        </p>

        <h2 class="about-section-title">Кабинет преподавателя</h2>
        <p>
          Преподаватели имеют доступ к специальному административному кабинету, который предоставляет
          комплексные инструменты для мониторинга и управления учебным процессом. В кабинете
          преподавателя все обучающиеся автоматически организованы по группам, что значительно
          упрощает навигацию и поиск нужных обучающихся. Также отображается отдельный раздел для
          пользователей, которые еще не указали номер группы.
        </p>
        <p>
          Для каждого обучающегося преподаватель может просмотреть детальную информацию о всех
          пройденных тестах. Это включает название теста, дату и время прохождения, детализацию
          ответов на каждый вопрос с указанием правильности, набранные баллы и итоговую оценку. Такая
          подробная информация позволяет преподавателю объективно оценивать знания обучающихся и
          выявлять области, требующие дополнительного внимания.
        </p>
        <p>
          В кабинете преподавателя также реализован полный доступ к файлам, загруженным обучающимися.
          Преподаватель может просматривать список всех файлов каждого обучающегося, скачивать их для
          проверки и при необходимости удалять. Это обеспечивает удобный контроль за выполнением
          заданий и проектов, а также позволяет организовать эффективную обратную связь с
          обучающимися.
        </p>
        <p>
          Дополнительно в кабинете преподавателя предусмотрена возможность управления пользователями:
          удаление аккаунтов обучающихся при необходимости, что обеспечивает гибкость в
          администрировании системы и поддержании актуальности списка пользователей.
        </p>

        <div class="about-images">
          <img :src="about1" alt="Брауни" />
          <img :src="about2" alt="Десерт из взбитых сливок" />
          <img :src="about3" alt="Варенье" />
        </div>
      </div>
    </section>
  </main>
</template>
```

- [ ] **Step 3: Создать `client-vue/src/views/ContactsView.vue`**

```vue
<script setup lang="ts"></script>

<template>
  <main id="contacts" class="container my-4 contacts">
    <h1>Контакты</h1>
    <section>
      <div class="table-responsive">
        <table class="table table-bordered contact-table">
          <tbody>
            <tr>
              <td>
                <p>
                  <strong>Учреждение образования:</strong>
                  <span class="block">"Витебский государственный индустриальный колледж"</span>
                </p>
                <p><strong>Адрес:</strong></p>
                <p>210038, г. Витебск, <span class="block">ул. Терешковой, 20 </span></p>
                <p><strong>E-mail:</strong> <a href="mailto:mail@vgik.by">mail@vgik.by</a></p>
              </td>
              <td>
                <p><strong>Время работы:</strong></p>
                <p>ПН. – ПТ., 8:00 - 17:00</p>
                <p><strong>Приёмная директора:</strong></p>
                <p>Телефон/Факс: <a href="tel:+80212672029">+80 212 67 20 29</a></p>
                <p><strong>Приёмная комиссия:</strong></p>
                <p>Телефон: <a href="tel:+375292407898">+375 29 240 78 98</a></p>
                <p><strong>Учебная часть:</strong></p>
                <p>Телефон: <a href="tel:+80212673215">+80 212 67 32 15</a></p>
              </td>
            </tr>
            <tr>
              <td colspan="2" class="horizontal-line"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
```

- [ ] **Step 4: Подключить CSS в `client-vue/src/main.ts`**

```ts
import '@/assets/pages/about.css'
import '@/assets/pages/contacts.css'
```

- [ ] **Step 5: Переключить маршруты в `client-vue/src/router/index.ts`**

Добавить импорты:
```ts
import AboutView from '@/views/AboutView.vue'
import ContactsView from '@/views/ContactsView.vue'
```
В маршрутах `about` и `contacts` заменить `component: PlaceholderView` на соответствующие компоненты.

- [ ] **Step 6: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: всё зелёное.

- [ ] **Step 7: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: страницы About и Contacts"
```

---

## Task 7: Страницы Criteria и 404

**Files:**
- Create: `client-vue/src/assets/pages/criteria.css` (копия `client/src/pages/Criteria/Criteria.css`)
- Create: `client-vue/src/views/CriteriaView.vue`
- Modify: `client-vue/src/views/NotFoundView.vue`
- Modify: `client-vue/src/router/index.ts` (criteria → CriteriaView)
- Modify: `client-vue/src/main.ts` (импорт criteria.css)

**Interfaces:**
- Produces: `CriteriaView` (4 таблицы шкал), обновлённый `NotFoundView`.

- [ ] **Step 1: Скопировать CSS критериев**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && \
cp client/src/pages/Criteria/Criteria.css client-vue/src/assets/pages/criteria.css && echo ok
```

- [ ] **Step 2: Создать `client-vue/src/views/CriteriaView.vue`**

Данные таблиц вынесены в массивы (как в старом `generateCriteriaTables`), таблицы — через `v-for`.

```vue
<script setup lang="ts">
const scores10 = [8, 8, 8, 10, 10, 10, 10, 10, 10, 16]
const scores15 = [4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 10, 12, 12]
const grades10 = [
  ['1-8', 1],
  ['9-16', 2],
  ['17-27', 3],
  ['28-38', 4],
  ['39-49', 5],
  ['50-65', 6],
  ['66-76', 7],
  ['86-90', 8],
  ['91-95', 9],
  ['96-100', 10],
] as const
const grades15 = [
  ['1-8', 1],
  ['9-16', 2],
  ['17-26', 3],
  ['27-36', 4],
  ['37-48', 5],
  ['49-59', 6],
  ['60-70', 7],
  ['71-80', 8],
  ['81-91', 9],
  ['92-100', 10],
] as const
</script>

<template>
  <main id="criteria" class="container my-4">
    <h1>Оценочные критерии тестов</h1>
    <section>
      <div class="criteria-container">
        <div class="alert alert-info mb-4" role="alert">
          <div class="criteria-explanation">
            <p class="mb-2">
              Данные таблицы описывают систему оценивания тестов по количеству набранных баллов. В
              зависимости от числа вопросов в тесте (10 или 15), каждая таблица отображает
              максимальные баллы, которые можно получить за каждый вопрос, а также шкалу перевода
              общего числа баллов в итоговую оценку.
            </p>
            <p class="mb-2">
              - Первая таблица показывает распределение баллов для теста с 10 вопросами: каждому
              вопросу присвоен вес в баллах, который влияет на итоговую оценку.
            </p>
            <p class="mb-2">
              - Вторая таблица иллюстрирует, как сумма набранных баллов по тесту с 10 вопросами
              переводится в оценку по десятибалльной шкале.
            </p>
            <p class="mb-2">
              - Третья таблица описывает распределение баллов для теста с 15 вопросами, аналогично
              первой таблице, где каждый вопрос имеет свой вес.
            </p>
            <p class="mb-2">
              - Четвертая таблица аналогично второй показывает перевод суммы баллов теста с 15
              вопросами в итоговую оценку.
            </p>
            <p class="mb-2">
              Это позволяет наглядно увидеть, сколько баллов можно получить за каждый вопрос и как это
              влияет на итоговый результат тестирования.
            </p>
          </div>
        </div>

        <h2 class="mb-3">
          Шкала определяющая максимальное количество баллов за каждое задание для теста с 10 вопросами
        </h2>
        <div class="table-responsive">
          <table class="table table-bordered table-striped table-hover criteria-table">
            <thead class="table-dark">
              <tr>
                <th>№ вопроса</th>
                <th v-for="n in scores10.length" :key="n">{{ n }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Количество баллов</strong></td>
                <td v-for="(s, i) in scores10" :key="i">{{ s }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 class="mb-3 mt-4">Шкала перевода суммарного количества баллов для теста с 10 вопросами</h2>
        <div class="table-responsive">
          <table class="table table-bordered table-striped table-hover criteria-table small-table">
            <thead class="table-dark">
              <tr>
                <th>Количество баллов</th>
                <th class="grade-column">Оценка</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in grades10" :key="row[0]">
                <td>{{ row[0] }}</td>
                <td class="grade-column">
                  <strong>{{ row[1] }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 class="mb-3 mt-4">
          Шкала определяющая максимальное количество баллов за каждое задание для теста с 15 вопросами
        </h2>
        <div class="table-responsive">
          <table class="table table-bordered table-striped table-hover criteria-table">
            <thead class="table-dark">
              <tr>
                <th>№ вопроса</th>
                <th v-for="n in scores15.length" :key="n">{{ n }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Количество баллов</strong></td>
                <td v-for="(s, i) in scores15" :key="i">{{ s }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 class="mb-3 mt-4">Шкала перевода суммарного количества баллов для теста с 15 вопросами</h2>
        <div class="table-responsive">
          <table class="table table-bordered table-striped table-hover criteria-table small-table">
            <thead class="table-dark">
              <tr>
                <th>Количество баллов</th>
                <th class="grade-column">Оценка</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in grades15" :key="row[0]">
                <td>{{ row[0] }}</td>
                <td class="grade-column">
                  <strong>{{ row[1] }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </main>
</template>
```

- [ ] **Step 3: Обновить `client-vue/src/views/NotFoundView.vue`** (вёрстка как в старом Error404)

```vue
<script setup lang="ts"></script>

<template>
  <main id="error-404" class="container my-4">
    <h1>Ошибка 404</h1>
    <section>
      <p>Страница не найдена, попробуйте вернуться на <RouterLink to="/">главную</RouterLink>.</p>
    </section>
  </main>
</template>
```

- [ ] **Step 4: Подключить CSS в `client-vue/src/main.ts`**

```ts
import '@/assets/pages/criteria.css'
```

- [ ] **Step 5: Переключить маршрут `criteria` в `client-vue/src/router/index.ts`**

Добавить импорт `import CriteriaView from '@/views/CriteriaView.vue'` и в маршруте `criteria` заменить `component: PlaceholderView` на `CriteriaView`.

- [ ] **Step 6: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: всё зелёное.

- [ ] **Step 7: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: страницы Criteria и 404"
```

---

## Task 8: Финальная проверка и ручная сверка

**Files:** (изменений кода нет — проверка)

- [ ] **Step 1: Полный прогон тестов, типов, сборки, линта**

```bash
cd client-vue && npm run test:unit && npm run type-check && npm run build && npm run lint
```
Ожидаемо: все тесты зелёные, без ошибок типов/сборки/линта.

- [ ] **Step 2: Ручная визуальная сверка (dev-сервер)**

```bash
cd client-vue && npm run dev
```
Проверить, сравнивая со старым клиентом:
- `/login` — полноэкранный фон, логотип, заголовки, форма; глаз показывает/скрывает пароль; пустые поля → красный тост сверху; (с поднятым сервером) регистрация → модалка успеха и переход на `/`. **Header/Menu/Footer на /login не отображаются.**
- `/about` — текст в три раздела + 3 картинки внизу.
- `/contacts` — таблица с контактами.
- `/criteria` — 4 таблицы шкал + пояснение.
- несуществующий путь → страница «Ошибка 404» со ссылкой на главную.
Остановить сервер (Ctrl+C).

- [ ] **Step 3: Финальный коммит (если ручная сверка потребовала правок — иначе пропустить)**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && git commit -m "fix: правки по итогам визуальной сверки Этапа 2"
```

---

## Definition of Done (Этап 2)

- [ ] `npm run test:unit` зелёный (validation, notifications, LoginView + ранее накопленные).
- [ ] `type-check`, `build`, `lint` — без ошибок.
- [ ] Login: вход, регистрация (+модалка успеха), показ пароля, валидация, тосты ошибок; полноэкранный layout без Header/Menu/Footer.
- [ ] About, Contacts, Criteria, 404 — вёрстка и CSS 1-в-1 со старым клиентом.
- [ ] Маршруты `/login`, `/about`, `/contacts`, `/criteria`, 404 ведут на реальные компоненты (не Placeholder).
- [ ] Home осознанно остаётся заглушкой (каталог тем — Этап 4).
- [ ] Все коммиты локально в `feat/vue-rewrite`; `client/` и `server/` не тронуты; на GitHub не запушено.
```
