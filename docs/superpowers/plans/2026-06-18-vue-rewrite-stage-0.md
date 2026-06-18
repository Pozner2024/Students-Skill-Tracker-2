# Этап 0: Каркас client-vue — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать рабочий каркас нового Vue 3 SPA-клиента в папке `client-vue/`, готовый к переносу страниц на следующих этапах.

**Architecture:** Vite-проект на шаблоне `vue-ts`. Подключаем Vue Router (роутинг), Pinia (состояние), Bootstrap (стили), ESLint+Prettier (качество). Настраиваем dev-proxy `/api` → локальный NestJS, алиас `@` → `src`. Раскладываем целевую структуру папок с заглушками. Старый `client/` не трогаем.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vite, TypeScript, Vue Router, Pinia, Bootstrap 5, ESLint 9 (flat config) + Prettier.

## Global Constraints

- Среда: Node v24.13.1, npm 11.8.0 (уже установлены).
- Весь новый код — в папке `client-vue/`. Старый `client/` и `server/` НЕ изменять.
- Язык — TypeScript. Компоненты — Composition API + `<script setup>`.
- Стили — Bootstrap 5 (CSS), сохраняем; свой CSS позже переносим в scoped-стили.
- Ветка — `feat/vue-rewrite` (уже создана и активна). Коммитим **только локально**, на GitHub НЕ пушим (прод не трогаем).
- Все npm-команды выполняются из каталога `client-vue/`, если не сказано иное.
- API сервера — под префиксом `/api`, локально порт `3000`.

---

## Структура файлов (что создаём в этом этапе)

```
client-vue/
├─ index.html                 (из шаблона; правим <title>)
├─ package.json               (скрипты dev/build/preview/type-check/lint/format)
├─ vite.config.ts             алиас @ + dev-proxy /api
├─ tsconfig.app.json          baseUrl + paths для @
├─ eslint.config.ts           flat config (Vue + TS + Prettier)
├─ .prettierrc.json
├─ src/
│  ├─ main.ts                 createApp + pinia + router + bootstrap CSS
│  ├─ App.vue                 каркас: <RouterView />
│  ├─ router/index.ts         маршруты-заглушки (home, 404)
│  ├─ stores/auth.ts          заглушка Pinia-стора
│  ├─ views/
│  │  ├─ HomeView.vue         заглушка
│  │  └─ NotFoundView.vue     заглушка
│  ├─ assets/base.css         базовые стили (пустой каркас)
│  ├─ api/.gitkeep
│  ├─ composables/.gitkeep
│  └─ components/
│     ├─ layout/.gitkeep
│     ├─ ui/.gitkeep
│     ├─ test/.gitkeep
│     └─ editors/.gitkeep
└─ (удаляем демо-файлы шаблона: HelloWorld.vue, style.css, assets/vue.svg)
```

---

## Task 1: Скаффолдинг Vite Vue-TS проекта

**Files:**
- Create: `client-vue/` (весь шаблон Vite `vue-ts`)

**Interfaces:**
- Produces: рабочий Vite-проект с `npm run dev` / `npm run build`.

- [ ] **Step 1: Сгенерировать проект из шаблона**

Из корня репозитория (`D:/Наташа/Students-Skill-Tracker-2`):
```bash
npm create vite@latest client-vue -- --template vue-ts
```
Ожидаемо: создаётся папка `client-vue/` с файлами шаблона. Если спросит установить `create-vite` — соглашаемся (в неинтерактивной среде проходит само).

- [ ] **Step 2: Установить зависимости**

```bash
cd client-vue && npm install
```
Ожидаемо: появляется `node_modules/`, команда завершается без ошибок.

- [ ] **Step 3: Проверить, что проект собирается**

```bash
cd client-vue && npm run build
```
Ожидаемо: `vue-tsc -b && vite build` проходит, появляется `client-vue/dist/`.

- [ ] **Step 4: Убедиться, что node_modules/dist игнорируются**

Шаблон Vite уже создаёт `client-vue/.gitignore` с `node_modules` и `dist`. Проверить:
```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git status --porcelain client-vue | grep -E 'node_modules|dist/' || echo "ok: node_modules/dist не попадают в индекс"
```
Ожидаемо: `ok: ...` (эти папки не отслеживаются).

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add client-vue
git commit -m "chore: скаффолдинг client-vue (Vite + Vue 3 + TS)"
```

---

## Task 2: Настроить vite.config (алиас @ + dev-proxy /api) и tsconfig paths

**Files:**
- Modify: `client-vue/vite.config.ts`
- Modify: `client-vue/tsconfig.app.json`
- Modify: `client-vue/package.json` (devDependency `@types/node`)

**Interfaces:**
- Produces: импорт через `@/...`; запросы `/api/*` в dev проксируются на `http://localhost:3000`.

- [ ] **Step 1: Установить типы Node (нужны для node:url в конфиге)**

```bash
cd client-vue && npm install -D @types/node
```

- [ ] **Step 2: Заменить содержимое `client-vue/vite.config.ts`**

```ts
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
      // Запросы /api/* уходят на локальный NestJS (префикс /api сохраняется)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: Добавить путь `@` в `client-vue/tsconfig.app.json`**

В объект `compilerOptions` добавить (рядом с существующими опциями):
```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

- [ ] **Step 4: Проверить сборку и типы**

```bash
cd client-vue && npm run build
```
Ожидаемо: сборка проходит без ошибок типов.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add client-vue/vite.config.ts client-vue/tsconfig.app.json client-vue/package.json client-vue/package-lock.json
git commit -m "chore: vite alias @ и dev-proxy /api для client-vue"
```

---

## Task 3: Подключить Bootstrap и базовые стили

**Files:**
- Create: `client-vue/src/assets/base.css`
- Modify: `client-vue/src/main.ts`
- Delete: `client-vue/src/style.css`, `client-vue/src/components/HelloWorld.vue`, `client-vue/src/assets/vue.svg`

**Interfaces:**
- Produces: глобально доступны классы Bootstrap; точка входа `src/main.ts` импортирует стили.

- [ ] **Step 1: Установить Bootstrap**

```bash
cd client-vue && npm install bootstrap@5
```

- [ ] **Step 2: Удалить демо-файлы шаблона**

```bash
cd client-vue && rm -f src/style.css src/components/HelloWorld.vue src/assets/vue.svg
```

- [ ] **Step 3: Создать `client-vue/src/assets/base.css`**

```css
/* Базовые стили приложения. Сюда позже переносим общий CSS со старого клиента. */
:root {
  color-scheme: light;
}

body {
  margin: 0;
  min-height: 100vh;
}
```

- [ ] **Step 4: Заменить содержимое `client-vue/src/main.ts`**

```ts
import { createApp } from 'vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/assets/base.css'

const app = createApp(App)
app.mount('#app')
```

- [ ] **Step 5: Заменить содержимое `client-vue/src/App.vue` (убрать демо)**

```vue
<script setup lang="ts"></script>

<template>
  <div id="app-root">
    <h1 class="text-center my-4">client-vue работает</h1>
  </div>
</template>
```

- [ ] **Step 6: Проверить сборку**

```bash
cd client-vue && npm run build
```
Ожидаемо: сборка проходит, ошибок об отсутствующих `HelloWorld`/`style.css` нет.

- [ ] **Step 7: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: подключить Bootstrap и базовые стили в client-vue"
```

---

## Task 4: Vue Router + страницы-заглушки

**Files:**
- Create: `client-vue/src/router/index.ts`
- Create: `client-vue/src/views/HomeView.vue`
- Create: `client-vue/src/views/NotFoundView.vue`
- Modify: `client-vue/src/App.vue`
- Modify: `client-vue/src/main.ts`

**Interfaces:**
- Consumes: алиас `@` (Task 2).
- Produces: экспорт по умолчанию `router` из `@/router`; маршруты `/` (name `home`) и catch-all `/:pathMatch(.*)*` (name `not-found`).

- [ ] **Step 1: Установить Vue Router**

```bash
cd client-vue && npm install vue-router@4
```

- [ ] **Step 2: Создать `client-vue/src/views/HomeView.vue`**

```vue
<script setup lang="ts"></script>

<template>
  <main class="container my-4">
    <h1>Главная (заглушка)</h1>
    <p>Страница будет перенесена на следующих этапах.</p>
  </main>
</template>
```

- [ ] **Step 3: Создать `client-vue/src/views/NotFoundView.vue`**

```vue
<script setup lang="ts"></script>

<template>
  <main class="container my-4">
    <h1>404 — страница не найдена</h1>
    <RouterLink to="/">На главную</RouterLink>
  </main>
</template>
```

- [ ] **Step 4: Создать `client-vue/src/router/index.ts`**

```ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

export default router
```

- [ ] **Step 5: Заменить содержимое `client-vue/src/App.vue`**

```vue
<script setup lang="ts"></script>

<template>
  <RouterView />
</template>
```

- [ ] **Step 6: Подключить router в `client-vue/src/main.ts`**

```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/assets/base.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

- [ ] **Step 7: Проверить сборку**

```bash
cd client-vue && npm run build
```
Ожидаемо: сборка проходит без ошибок.

- [ ] **Step 8: Проверить рендер вручную (dev-сервер)**

```bash
cd client-vue && npm run dev
```
Открыть `http://localhost:5173/` — видно «Главная (заглушка)». Открыть `http://localhost:5173/qwerty` — видно «404». Остановить сервер (Ctrl+C).

- [ ] **Step 9: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: vue-router и страницы-заглушки home/404 в client-vue"
```

---

## Task 5: Pinia + заглушка auth-стора

**Files:**
- Create: `client-vue/src/stores/auth.ts`
- Modify: `client-vue/src/main.ts`

**Interfaces:**
- Consumes: алиас `@` (Task 2).
- Produces: `useAuthStore` из `@/stores/auth` со state `{ user: null, token: null }` и геттером `isAuthenticated`.

- [ ] **Step 1: Установить Pinia**

```bash
cd client-vue && npm install pinia
```

- [ ] **Step 2: Создать `client-vue/src/stores/auth.ts` (заглушка, наполним на Этапе 1)**

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Заглушка: реальная логика входа/выхода и загрузки пользователя — на Этапе 1.
export const useAuthStore = defineStore('auth', () => {
  const user = ref<unknown | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  return { user, token, isAuthenticated }
})
```

- [ ] **Step 3: Подключить Pinia в `client-vue/src/main.ts`**

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from '@/router'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/assets/base.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

- [ ] **Step 4: Проверить сборку**

```bash
cd client-vue && npm run build
```
Ожидаемо: сборка проходит без ошибок.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: подключить Pinia и заглушку auth-стора в client-vue"
```

---

## Task 6: ESLint + Prettier

**Files:**
- Create: `client-vue/eslint.config.ts`
- Create: `client-vue/.prettierrc.json`
- Modify: `client-vue/package.json` (скрипты `lint`, `format`, `type-check`)

**Interfaces:**
- Produces: `npm run lint` и `npm run format` в `client-vue/`.

- [ ] **Step 1: Установить инструменты линтинга**

```bash
cd client-vue && npm install -D eslint eslint-plugin-vue @vue/eslint-config-typescript @vue/eslint-config-prettier prettier jiti
```

- [ ] **Step 2: Создать `client-vue/eslint.config.ts`**

```ts
import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/node_modules/**']),
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
)
```

- [ ] **Step 3: Создать `client-vue/.prettierrc.json`**

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "semi": false,
  "singleQuote": true,
  "printWidth": 100
}
```

- [ ] **Step 4: Добавить скрипты в `client-vue/package.json`**

В блок `"scripts"` добавить:
```json
"type-check": "vue-tsc --build",
"lint": "eslint . --fix",
"format": "prettier --write src/"
```

- [ ] **Step 5: Запустить линтер**

```bash
cd client-vue && npm run lint
```
Ожидаемо: завершается без ошибок (мелкие автофиксы допустимы).

- [ ] **Step 6: Запустить форматирование**

```bash
cd client-vue && npm run format
```
Ожидаемо: Prettier приводит файлы в `src/` к единому стилю.

- [ ] **Step 7: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "chore: настроить ESLint и Prettier в client-vue"
```

---

## Task 7: Структура папок, заголовок страницы, CLAUDE.md и финальная проверка

**Files:**
- Create: `client-vue/src/api/.gitkeep`, `client-vue/src/composables/.gitkeep`, `client-vue/src/components/layout/.gitkeep`, `client-vue/src/components/ui/.gitkeep`, `client-vue/src/components/test/.gitkeep`, `client-vue/src/components/editors/.gitkeep`
- Modify: `client-vue/index.html` (`<title>`)
- Modify: `CLAUDE.md` (раздел с командами client-vue)

**Interfaces:**
- Produces: целевая структура папок проекта; документация команд нового клиента.

- [ ] **Step 1: Создать пустые папки целевой структуры**

```bash
cd client-vue && \
mkdir -p src/api src/composables src/components/layout src/components/ui src/components/test src/components/editors && \
touch src/api/.gitkeep src/composables/.gitkeep \
  src/components/layout/.gitkeep src/components/ui/.gitkeep \
  src/components/test/.gitkeep src/components/editors/.gitkeep
```

- [ ] **Step 2: Поправить `<title>` в `client-vue/index.html`**

Заменить содержимое тега `<title>` на:
```html
<title>Students Skill Tracker</title>
```

- [ ] **Step 3: Дописать раздел про client-vue в корневой `CLAUDE.md`**

В раздел «## Команды» добавить подраздел:
```markdown
### Клиент Vue (новый, `client-vue/`)
- `npm run dev` — Vite dev-сервер (порт 5173), проксирует `/api` на `http://localhost:3000`.
- `npm run build` — type-check (vue-tsc) + продакшн-сборка в `dist/`.
- `npm run type-check` — только проверка типов.
- `npm run lint` — ESLint с автофиксом. `npm run format` — Prettier.

> Для работы dev-клиента локально должен быть запущен сервер на порту 3000
> (`server/`: `npm run start:dev`, либо через docker-compose).
```

- [ ] **Step 4: Финальная проверка — типы и сборка**

```bash
cd client-vue && npm run type-check && npm run build
```
Ожидаемо: проверка типов проходит, сборка собирается в `dist/`.

- [ ] **Step 5: Финальная проверка — линтер**

```bash
cd client-vue && npm run lint
```
Ожидаемо: без ошибок.

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue CLAUDE.md
git commit -m "chore: структура папок client-vue, заголовок страницы и обновление CLAUDE.md"
```

---

## Definition of Done (Этап 0)

- [ ] `client-vue/` существует, `npm run dev` поднимает приложение, видны заглушки `/` и `/404`.
- [ ] `npm run build` и `npm run type-check` проходят без ошибок.
- [ ] `npm run lint` проходит без ошибок.
- [ ] dev-proxy `/api` → `http://localhost:3000` настроен; алиас `@` → `src` работает.
- [ ] Структура папок (`api`, `stores`, `composables`, `components/{layout,ui,test,editors}`, `views`, `router`, `assets`) на месте.
- [ ] CLAUDE.md дополнен командами client-vue.
- [ ] Все коммиты только локально в ветке `feat/vue-rewrite`; на GitHub ничего не запушено; `client/` и `server/` не изменены.
