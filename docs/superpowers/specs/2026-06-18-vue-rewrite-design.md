# Переписывание клиента на Vue 3 — дизайн

**Дата:** 2026-06-18
**Статус:** утверждён, готов к планированию реализации

## Цель

Переписать фронтенд проекта Students Skill Tracker с самописного vanilla-JS-клиента
на современный Vue 3 SPA, сохранив поведение один-в-один. Серверная часть (NestJS +
Prisma + Postgres) и контракты API не меняются.

## Контекст: что есть сейчас

**Клиент (`client/`)** — vanilla JS на webpack:
- Самописный роутер (`src/router/index.js` + `routerConfig.js`) с history API и
  middleware: `authMiddleware`, `adminRedirectMiddleware`, `specialRouteMiddleware`.
- Классовые «компоненты», которые собирают HTML строками (`render()` / `renderPage()`)
  и навешивают события в `init()`. Базовые классы `common/Page.js`, `common/Section.js`.
- Страницы: Home, About, Contacts, Criteria, Profile, Admin, TestPage, TopicPage,
  LoginPage, Error404.
- Сервис-слой на fetch: `services/apiClient.js`, `authApi.js`, `authCore.js`,
  `authService.js`, `userService.js`, `errorHandler.js`.
- Стили: Bootstrap 5 + много пер-страничного CSS, глобально импортируемого в `App.js`.
- Сторонние: CKEditor (классический), canvas-confetti, drag-and-drop в админке.
- Тесты: Cypress e2e (`client/cypress/e2e/*.cy.js`).

**Сервер (`server/`)** — NestJS 11 + Prisma 6 + Postgres. Контроллеры: admin, auth,
images, test-results, tests, topics, upload, users. Auth — JWT (passport-jwt, argon2).
Файлы — S3 (Yandex Cloud) через multer/sharp. **В рамках этой работы не меняется.**

**Деплой** — docker-compose: `db`, `server`, `nginx`. nginx раздаёт статику клиента и
проксирует `/api` на сервер, терминирует TLS.

## Утверждённые решения

| Вопрос | Решение |
|---|---|
| Стратегия | Чистая переписка с нуля в отдельной папке `client-vue/`; старый `client/` живёт рядом до конца, переключение на деплое |
| Фреймворк | Vue 3 (Composition API, `<script setup>`) + Vite SPA. **Не** Nuxt/Next — приложение за авторизацией, SSR/SEO не нужны |
| Язык | TypeScript |
| Роутинг | Vue Router; текущие middleware → navigation guards |
| Состояние | Pinia (authStore, uiStore) |
| Стили | Bootstrap 5 сохраняем; существующий CSS переносим в scoped-стили компонентов; интерактив Bootstrap (модалки, бургер-меню) переписываем на Vue вместо `bootstrap.bundle.js` |
| Объём | Точная копия функционала 1-в-1, без новых фич |

## Целевая архитектура

```
client-vue/
├─ CLAUDE.md                  документация для работы с проектом
├─ index.html
├─ vite.config.ts             dev-proxy на /api, алиасы путей
├─ src/
│  ├─ main.ts                 создание app, подключение router/pinia/bootstrap
│  ├─ App.vue                 каркас: Header + Menu + <RouterView> + Footer + loader
│  ├─ router/
│  │  ├─ index.ts             маршруты (аналог routerConfig.js)
│  │  └─ guards.ts            navigation guards = текущие auth/admin/special middleware
│  ├─ stores/                 Pinia: authStore (user, токен), uiStore (loader)
│  ├─ api/
│  │  ├─ http.ts              обёртка fetch (бывшие apiClient + errorHandler)
│  │  └─ auth.ts, tests.ts, topics.ts, users.ts, upload.ts
│  ├─ composables/            переиспользуемая логика (useConfetti, usePagination…)
│  ├─ components/
│  │  ├─ layout/              Header.vue, Menu.vue, Footer.vue
│  │  ├─ ui/                  CubeLoader, SkillProgressBar, Pagination, Modal…
│  │  ├─ test/                компоненты типов вопросов (matching, ordering и т.д.)
│  │  └─ editors/             CKEditor-обёртка
│  ├─ views/                  Home, About, Contacts, Criteria, Login, Profile,
│  │                          Admin, TestPage, TopicPage, Error404
│  └─ assets/                 картинки + CSS
└─ (Dockerfile + nginx — на этапе деплоя)
```

### Соответствие старого и нового кода

| Сейчас (vanilla) | Станет (Vue) |
|---|---|
| Самописный `Router` + строковый HTML | Vue Router + `.vue`-компоненты с реактивностью |
| `authMiddleware`, `adminRedirectMiddleware`, `specialRouteMiddleware` | navigation guards в `router/guards.ts` |
| Классы-страницы с `render()` / `init()` | `views/*.vue` (template + `<script setup>`) |
| `services/*` (fetch вручную) | `api/*` (типизировано) + Pinia `authStore` |
| Глобальный CSS-импорт в `App.js` | scoped-стили компонентов + общий `base.css` |
| `bootstrap.bundle.js` | Bootstrap CSS остаётся; интерактив на Vue |

## Поэтапный план

Каждый этап самодостаточен: в конце приложение собирается и работает. Тесты прохожу
в конце каждого этапа, а не сваливаю в конец. Старый `client/` остаётся рабочим до
этапа 8 — откат возможен в любой момент.

- **Этап 0 — Каркас + CLAUDE.md.** Создать `client-vue/` (Vue 3 + Vite + TS, Vue Router,
  Pinia, Bootstrap, ESLint/Prettier). dev-proxy на `/api`, env, алиасы. Написать CLAUDE.md.
- **Этап 1 — Фундамент.** `services/*` → типизированный `api/*`. Pinia `authStore`
  (user, токен, вход/выход, `getCurrentUser`). Vue Router + guards = текущие middleware.
  Каркас `App.vue` + layout (Header, Menu/бургер, Footer, CubeLoader).
- **Этап 2 — Простые и публичные страницы.** Login, About, Contacts, Home, Criteria, 404.
  Обкатка переноса вёрстки и CSS 1-в-1.
- **Этап 3 — Личный кабинет (Profile).** Форма профиля, данные пользователя, результаты
  тестов, секция файлов (загрузка/удаление/скачивание через S3-эндпоинты).
- **Этап 4 — Темы (Topics).** Список тем, страница темы, рендер контента CKEditor (просмотр).
- **Этап 5 — Тесты (TestPage).** Самый объёмный: все типы вопросов (matching, ordering и др.),
  навигация по вопросам, подсчёт баллов, сохранение результата, SkillProgressBar, confetti.
- **Этап 6 — Админка (Admin).** Панель, редактирование контента в CKEditor, drag-and-drop сортировка.
- **Этап 7 — Тесты приложения и сверка 1-в-1.** Перенести/адаптировать Cypress e2e, пройти
  каждую страницу и сверить поведение со старой версией.
- **Этап 8 — Сборка и деплой.** Vite-сборка; обновить `nginx/Dockerfile` и `docker-compose.yml`,
  чтобы раздавать `client-vue/dist`. Проверить на сервере. После успеха — удалить старый `client/`.

## Тестирование

- Cypress e2e сохраняем как основной инструмент сверки поведения; адаптируем существующие
  сценарии (`auth`, `test-flow`, `test-images`, `test-result*`) под новый клиент.
- На каждом этапе — ручная визуальная сверка соответствующих страниц со старой версией.
- Сборка `vite build` должна проходить без ошибок в конце каждого этапа.

## Риски и их снятие

- **Перенос интерактива Bootstrap (модалки, меню) на Vue** — потенциальные расхождения
  в поведении. Снятие: сверка 1-в-1 на этапе 2 на простых страницах до сложных.
- **CKEditor в Vue (просмотр и редактирование)** — интеграция классической сборки в Vue.
  Снятие: вынести в отдельную обёртку-компонент, отдельно протестировать на этапах 4 и 6.
- **Деплой-переключение** — риск простоя. Снятие: старый клиент остаётся до проверки нового
  на сервере; переключение только после успешной сверки.

## Вне объёма (YAGNI)

- Новые фичи и изменения UX.
- Изменения серверной части и схемы БД.
- SSR/SEO, Nuxt, смена дизайн-системы.
- Публичные (неавторизованные) разделы.
