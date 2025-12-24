# Students Skill Tracker

Система отслеживания навыков студентов с возможностью прохождения тестов, управления темами и файлами.

## 📋 Содержание

- [Описание проекта](#описание-проекта)
- [Технологии](#технологии)
- [Требования](#требования)
- [Установка и настройка](#установка-и-настройка)
- [Запуск проекта](#запуск-проекта)
- [Работа с базой данных](#работа-с-базой-данных)
- [Структура проекта](#структура-проекта)
- [API документация](#api-документация)
- [Разработка](#разработка)

## 🎯 Описание проекта

Students Skill Tracker — это веб-приложение для отслеживания прогресса студентов в изучении различных тем. Система позволяет:

- Проходить тесты по различным темам
- Отслеживать результаты тестирования
- Управлять темами и вопросами
- Загружать и управлять файлами
- Просматривать статистику и прогресс

## 🛠 Технологии

### Backend

- **NestJS** — фреймворк для Node.js
- **PostgreSQL** — реляционная база данных
- **Prisma** — ORM для работы с базой данных
- **JWT** — аутентификация
- **Argon2** — хеширование паролей
- **AWS S3** — хранение файлов

### Frontend

- **Vanilla JavaScript** — чистый JavaScript
- **Webpack** — сборщик модулей
- **Bootstrap 5** — UI фреймворк
- **CKEditor** — редактор контента

## 📦 Требования

- **Node.js** 20.x или выше
- **PostgreSQL** 16.x или выше (или Docker)
- **npm** или **yarn**
- **Docker** и **Docker Compose** (опционально, для упрощенного запуска)

## 🚀 Установка и настройка

### 1. Клонирование репозитория

```bash
git clone <https://github.com/Pozner2024/Students-Skill-Tracker-2>
cd Students-Skill-Tracker-2
```

### 2. Установка зависимостей

#### Backend

```bash
cd server
npm install
```

#### Frontend

```bash
cd client
npm install
```

### 3. Настройка переменных окружения

#### Backend (.env в папке `server/`)

Создайте файл `server/.env`:

```env
# База данных
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/students_skill_tracker"

# Сервер
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:9000,http://127.0.0.1:9000

# AWS S3 (опционально, если используется)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_BUCKET_NAME=your-bucket-name
AWS_ENDPOINT=your-endpoint
```

#### Frontend (.env в папке `client/`)

Создайте файл `client/.env`:

```env
API_BASE_URL=http://localhost:5000
```

## 🏃 Запуск проекта

### Вариант 1: Запуск с Docker (рекомендуется)

#### Шаг 1: Создайте файл `.env` в корне проекта

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=students_skill_tracker
POSTGRES_PORT=5432

# Server
SERVER_PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:9000,http://127.0.0.1:9000
```

#### Шаг 2: Запуск только базы данных

```bash
docker-compose up postgres
```

База данных будет доступна на `localhost:5432` и автоматически инициализируется из `server/init.sql`.

#### Шаг 3: Запуск всех сервисов

```bash
docker-compose up
```

Или в фоновом режиме:

```bash
docker-compose up -d
```

#### Шаг 4: Запуск сервера локально (если база в Docker)

```bash
cd server
npm run start:dev
```

#### Шаг 5: Запуск клиента

```bash
cd client
npm run dev
```

### Вариант 2: Локальный запуск без Docker

#### Шаг 1: Установка PostgreSQL

Установите PostgreSQL локально и создайте базу данных:

```sql
CREATE DATABASE students_skill_tracker;
```

#### Шаг 2: Инициализация базы данных

```bash
cd server
psql -U postgres -d students_skill_tracker -f init.sql
```

Или используйте Prisma:

```bash
npx prisma db push
npx prisma generate
```

#### Шаг 3: Запуск сервера

```bash
cd server
npm run start:dev
```

Сервер будет доступен на `http://localhost:5000`

#### Шаг 4: Запуск клиента

```bash
cd client
npm run dev
```

Клиент будет доступен на `http://localhost:9000`

## 🗄 Работа с базой данных

### Инициализация базы данных

#### Способ 1: Использование init.sql

```bash
psql -U postgres -d students_skill_tracker -f server/init.sql
```

#### Способ 2: Использование Prisma

```bash
cd server
npx prisma db push
npx prisma generate
```

### Просмотр базы данных

#### Prisma Studio

```bash
cd server
npm run prisma:studio
```

Откроется веб-интерфейс на `http://localhost:5555`

пш## 📁 Структура проекта

```
Students-Skill-Tracker-2/
├── client/                 # Frontend приложение
│   ├── src/
│   │   ├── components/    # React-подобные компоненты
│   │   ├── pages/         # Страницы приложения
│   │   ├── services/      # API клиенты
│   │   └── config/        # Конфигурация
│   ├── public/            # Статические файлы
│   └── webpack.config.js  # Конфигурация Webpack
│
├── server/                # Backend приложение
│   ├── src/
│   │   ├── auth/         # Аутентификация
│   │   ├── users/        # Управление пользователями
│   │   ├── tests/        # Тесты
│   │   ├── topics/       # Темы
│   │   ├── upload/       # Загрузка файлов
│   │   └── prisma/       # Prisma сервис
│   ├── prisma/
│   │   ├── schema.prisma # Схема базы данных
│   │   └── migrations/   # Миграции
│   └── init.sql          # SQL скрипт инициализации
│
├── docker-compose.yml     # Docker Compose конфигурация
└── README.md             # Документация
```
