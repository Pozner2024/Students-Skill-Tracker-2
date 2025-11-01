-- Создание таблицы пользователей для системы аутентификации
-- Выполните этот скрипт в вашей базе данных PostgreSQL

-- Создание таблицы users
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL,
    "login" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Создание уникального индекса для логина
CREATE UNIQUE INDEX IF NOT EXISTS "users_login_key" ON "users"("login");

-- Создание индекса для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Добавление записи в таблицу _prisma_migrations (если нужно)
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    '20241201000000_add_user_model',
    'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    NOW(),
    '20241201000000_add_user_model',
    NULL,
    NULL,
    NOW(),
    1
) ON CONFLICT (id) DO NOTHING;
