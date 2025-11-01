-- Скрипт для обновления базы данных
-- Выполните этот скрипт в вашей PostgreSQL базе данных

-- Проверяем, существует ли таблица users
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'Table users does not exist. Please run: npx prisma db push';
    ELSE
        RAISE NOTICE 'Table users exists';
    END IF;
END $$;

-- Проверяем структуру таблицы users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Если нужно добавить email колонку (если её нет)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE "users" ADD COLUMN "email" VARCHAR(255);
        RAISE NOTICE 'Email column added';
    ELSE
        RAISE NOTICE 'Email column already exists';
    END IF;
END $$;

-- Если нужно удалить login колонку (если она есть)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'login') THEN
        -- Сначала обновляем email из login для существующих пользователей
        UPDATE "users" SET "email" = "login" WHERE "email" IS NULL;
        
        -- Удаляем уникальное ограничение на login
        ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_login_key";
        
        -- Удаляем колонку login
        ALTER TABLE "users" DROP COLUMN "login";
        
        RAISE NOTICE 'Login column removed and data migrated to email';
    ELSE
        RAISE NOTICE 'Login column does not exist';
    END IF;
END $$;

-- Устанавливаем email как NOT NULL и UNIQUE
DO $$
BEGIN
    -- Сначала делаем email NOT NULL
    ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
    
    -- Добавляем уникальное ограничение на email
    ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");
    
    RAISE NOTICE 'Email column set as NOT NULL and UNIQUE';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Email constraint already exists';
END $$;

-- Проверяем финальную структуру
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
