# CLAUDE.md

Руководство для Claude Code по работе с этим репозиторием.

## О проекте

**Students Skill Tracker** — веб-приложение для отслеживания навыков студентов:
прохождение тестов, темы с учебным контентом, личный кабинет, админка. Почти всё
приложение закрыто авторизацией (публичны только `/login`, `/about`, `/contacts`).

Монорепозиторий из двух частей:
- `client/` — фронтенд (сейчас vanilla JS на webpack).
- `server/` — бэкенд (NestJS + Prisma + Postgres).

## Текущий статус: миграция клиента на Vue 3

Идёт переписывание клиента с vanilla JS на **Vue 3 + Vite + TypeScript SPA**
(Vue Router, Pinia, сохраняем Bootstrap 5). Новый клиент создаётся в отдельной папке
`client-vue/`, старый `client/` остаётся рабочим до переключения на деплое.
**Серверная часть и контракты API не меняются.**

Дизайн и поэтапный план: `docs/superpowers/specs/2026-06-18-vue-rewrite-design.md`.

## Архитектура

### Клиент (`client/`) — vanilla JS (текущий)
- Самописный роутер: `src/router/index.js` + `src/router/routerConfig.js` (history API,
  middleware `authMiddleware` / `adminRedirectMiddleware` / `specialRouteMiddleware`).
- Классовые «компоненты»: собирают HTML строками (`render()` / `renderPage()`), события
  навешивают в `init()`. Базовые классы — `src/common/Page.js`, `src/common/Section.js`.
- Страницы — `src/pages/*`. Layout — `src/components/layout/*`. UI — `src/components/ui/*`.
- API-слой на fetch — `src/services/*` (`apiClient`, `authService`, `userService`,
  `errorHandler` и др.). Конфиг эндпоинтов — `src/config/api.js`.
- Стили: Bootstrap 5 + пер-страничный CSS, глобально импортируется в `src/App.js`.
- Сторонние: CKEditor (классический), canvas-confetti, drag-and-drop в админке.

### Сервер (`server/`) — NestJS
- NestJS 11 + Prisma 6 + Postgres. Контроллеры в `src/<feature>/*.controller.ts`:
  admin, auth, images, test-results, tests, topics, upload, users.
- Auth: JWT (passport-jwt, argon2). Файлы: S3 (Yandex Cloud) через multer/sharp.
- Схема БД — `server/prisma/`. Сид — `server/seed.ts`.

## Команды

### Клиент (vanilla, `client/`)
- `npm run dev` — webpack dev-server.
- `npm run build` — продакшн-сборка в `dist/`.
- `npm run cypress:open` / `npm run cypress:run` — e2e-тесты.

### Клиент Vue (новый, `client-vue/`)
- `npm run dev` — Vite dev-сервер (порт 5173), проксирует `/api` на `http://localhost:3000`.
- `npm run build` — type-check (vue-tsc) + продакшн-сборка в `dist/`.
- `npm run type-check` — только проверка типов.
- `npm run lint` — ESLint с автофиксом. `npm run format` — Prettier.

> Для работы dev-клиента локально должен быть запущен сервер на порту 3000
> (`server/`: `npm run start:dev`, либо через docker-compose).

### Сервер (`server/`)
- `npm run start:dev` — `prisma migrate deploy` + запуск.
- `npm run build` — `nest build`.
- `npm test` — unit-тесты (jest). `npm run test:e2e` — e2e.
- `npm run lint` — ESLint с автофиксом. `npm run format` — Prettier.
- `npm run prisma:studio` — Prisma Studio.

## Деплой

- `docker-compose.yml`: сервисы `db` (Postgres), `server` (NestJS), `nginx`.
- `nginx/` собирает образ, раздаёт статику клиента и проксирует `/api` на `server:3000`,
  терминирует TLS (сертификаты Let's Encrypt из `/etc/letsencrypt`).
- Прод-сервер: konditer-app.pro (детали инфраструктуры — в памяти Claude, не в репозитории).
- Переменные окружения — `.env.docker` (пример — `.env.example`).

## Конвенции

- Комментарии и пользовательские строки — на русском (как в текущем коде).
- Сервер — TypeScript, ESLint + Prettier. Новый клиент `client-vue/` — тоже TypeScript.
- При переписывании на Vue: точная копия поведения 1-в-1, без новых фич; готовые решения
  (Vue Router, Pinia) вместо самописных аналогов.
