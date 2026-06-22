# CLAUDE.md

Руководство для Claude Code по работе с этим репозиторием.

## О проекте

**Students Skill Tracker** — веб-приложение для отслеживания навыков студентов:
прохождение тестов, темы с учебным контентом, личный кабинет, админка. Почти всё
приложение закрыто авторизацией (публичны только `/login`, `/about`, `/contacts`).

Монорепозиторий из двух частей:
- `client-vue/` — фронтенд (Vue 3 + Vite + TypeScript SPA).
- `server/` — бэкенд (NestJS + Prisma + Postgres).

> Клиент переписан с самописного vanilla-JS (webpack) на Vue 3; миграция завершена
> и задеплоена на прод. Дизайн и история этапов: `docs/superpowers/specs/2026-06-18-vue-rewrite-design.md`
> и `docs/superpowers/plans/2026-06-18-vue-rewrite-stage-*.md`.

## Архитектура

### Клиент (`client-vue/`) — Vue 3
- Vue 3 (Composition API, `<script setup>`) + Vite + TypeScript, SPA. Bootstrap 5.
- Роутинг — Vue Router 4: `src/router/index.ts` (history mode) + guards `src/router/guards.ts`
  (редирект авторизации/админки).
- Состояние — Pinia: `src/stores/*` (`auth`, `ui`, `notifications`).
- Страницы — `src/views/*`. Компоненты — `src/components/*` (`layout/`, `ui/`, `topics/`,
  `test/`, `admin/`, `profile/`, `editors/`).
- API-слой на fetch — `src/api/*` (`http`, `config`, `auth`, `users`, `topics`, `tests`,
  `admin`, `errors`, `types`, `tokenStorage`, `validation`).
- Чистая логика — `src/utils/*` (`topicContent`, `testScoring`, `testFormat`, `adminFormat`,
  `validation`, `format`); покрыта unit-тестами (`*.spec.ts`).
- Стили — `src/assets/*`: дизайн-токены `base.css`, layout-CSS `layout/`, пер-страничный
  CSS `pages/`.
- Сторонние: CKEditor (классический build), canvas-confetti, drag-and-drop в админке.

### Сервер (`server/`) — NestJS
- NestJS 11 + Prisma 6 + Postgres. Контроллеры в `src/<feature>/*.controller.ts`:
  admin, auth, images, test-results, tests, topics, upload, users.
- Auth: JWT (passport-jwt, argon2). Файлы: S3 (Yandex Cloud) через multer/sharp.
- Схема БД — `server/prisma/`. Сид — `server/seed.ts`.

## Команды

### Клиент (`client-vue/`)
- `npm run dev` — Vite dev-сервер (порт 5173), проксирует `/api` на `http://localhost:3000`.
- `npm run build` — type-check (vue-tsc) + продакшн-сборка в `dist/`.
- `npm run type-check` — только проверка типов.
- `npm run lint` — ESLint с автофиксом. `npm run format` — Prettier.
- `npm run test:unit` — unit-тесты (Vitest). `npm run e2e:run` / `npm run e2e:open` — Cypress e2e.

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
- `nginx/Dockerfile` многостадийно собирает `client-vue/` (Vite → `dist/`) и раздаёт статику;
  проксирует `/api` на `server:3000`, терминирует TLS (Let's Encrypt из `/etc/letsencrypt`).
- Прод-сервер: konditer-app.pro (детали инфраструктуры — в памяти Claude, не в репозитории).
  Деплой ручной: на сервере `git pull origin main` → `docker compose build nginx`
  → `docker compose up -d --no-deps nginx`. CI/CD нет.
- Переменные окружения — `.env.docker` (пример — `.env.example`).

## Конвенции

- Комментарии и пользовательские строки — на русском (как в текущем коде).
- Сервер и клиент — TypeScript, ESLint + Prettier.
- Готовые решения (Vue Router, Pinia) вместо самописных аналогов.
