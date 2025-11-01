-- Скрипт для добавления полей fullName и groupNumber в таблицу users
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

-- Добавляем поле fullName если его нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'fullName') THEN
        ALTER TABLE "users" ADD COLUMN "fullName" VARCHAR(255);
        RAISE NOTICE 'fullName column added';
    ELSE
        RAISE NOTICE 'fullName column already exists';
    END IF;
END $$;

-- Добавляем поле groupNumber если его нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'groupNumber') THEN
        ALTER TABLE "users" ADD COLUMN "groupNumber" VARCHAR(50);
        RAISE NOTICE 'groupNumber column added';
    ELSE
        RAISE NOTICE 'groupNumber column already exists';
    END IF;
END $$;

-- Проверяем финальную структуру таблицы users
SELECT column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
