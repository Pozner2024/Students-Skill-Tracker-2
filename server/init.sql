-- ============================================
-- Students Skill Tracker Database Initialization
-- ============================================
-- Этот файл создает полную структуру базы данных PostgreSQL
-- для приложения Students Skill Tracker
-- ============================================

-- Создание таблицы users (пользователи)
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName" VARCHAR(255),
    "groupNumber" VARCHAR(50),
    "role" VARCHAR(20) NOT NULL DEFAULT 'student',
    "testResults" JSONB,
    "totalQuestionsAnswered" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION DEFAULT 0.0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Создание уникального индекса для email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Создание таблицы topics (темы)
CREATE TABLE IF NOT EXISTS "topics" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "project_name" VARCHAR(500) NOT NULL,
    "project_description" TEXT NOT NULL,
    "content" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- Создание таблицы questions (вопросы)
CREATE TABLE IF NOT EXISTS "questions" (
    "id" SERIAL NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- Создание таблицы tests (тесты)
CREATE TABLE IF NOT EXISTS "tests" (
    "id" SERIAL NOT NULL,
    "test_code" VARCHAR(20) NOT NULL,
    "test_title" TEXT NOT NULL,
    "variant" INTEGER NOT NULL,
    "questions" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- Создание таблицы test_images (изображения для тестов)
CREATE TABLE IF NOT EXISTS "test_images" (
    "id" SERIAL NOT NULL,
    "test_code" VARCHAR(20) NOT NULL,
    "variant" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "test_images_pkey" PRIMARY KEY ("id")
);

-- Создание таблицы user_files (файлы пользователей)
CREATE TABLE IF NOT EXISTS "user_files" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fileName" VARCHAR(500) NOT NULL,
    "fileKey" VARCHAR(1000) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "contentType" VARCHAR(100),
    "folder" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_files_pkey" PRIMARY KEY ("id")
);

-- Создание индексов
CREATE UNIQUE INDEX IF NOT EXISTS "tests_test_code_key" ON "tests"("test_code");
CREATE UNIQUE INDEX IF NOT EXISTS "test_images_test_code_variant_topic_id_key" ON "test_images"("test_code", "variant", "topic_id");
CREATE INDEX IF NOT EXISTS "user_files_userId_idx" ON "user_files"("userId");
CREATE INDEX IF NOT EXISTS "user_files_userId_folder_idx" ON "user_files"("userId", "folder");

-- Создание внешних ключей (Foreign Keys)
ALTER TABLE "questions" 
    ADD CONSTRAINT "questions_topic_id_fkey" 
    FOREIGN KEY ("topic_id") 
    REFERENCES "topics"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

ALTER TABLE "user_files" 
    ADD CONSTRAINT "user_files_userId_fkey" 
    FOREIGN KEY ("userId") 
    REFERENCES "users"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;



