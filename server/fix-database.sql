-- Скрипт для исправления структуры таблицы users
-- Выполните этот скрипт в вашей PostgreSQL базе данных

-- Проверяем текущую структуру таблицы users
SELECT column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Добавляем поле fullName если его нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'fullName'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "fullName" VARCHAR(255);
        RAISE NOTICE '✅ fullName column added successfully';
    ELSE
        RAISE NOTICE 'ℹ️ fullName column already exists';
    END IF;
END $$;

-- Добавляем поле groupNumber если его нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'groupNumber'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "groupNumber" VARCHAR(50);
        RAISE NOTICE '✅ groupNumber column added successfully';
    ELSE
        RAISE NOTICE 'ℹ️ groupNumber column already exists';
    END IF;
END $$;

-- Проверяем финальную структуру таблицы users
SELECT column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Тестируем создание пользователя с новыми полями
DO $$
DECLARE
    test_user_id INTEGER;
BEGIN
    -- Создаем тестового пользователя
    INSERT INTO "users" (email, password, "fullName", "groupNumber", created_at, updated_at)
    VALUES (
        'test@example.com',
        'hashed_password',
        'Тестовый Пользователь',
        'ГР-2024-01',
        NOW(),
        NOW()
    )
    RETURNING id INTO test_user_id;
    
    RAISE NOTICE '✅ Test user created with ID: %', test_user_id;
    
    -- Удаляем тестового пользователя
    DELETE FROM "users" WHERE id = test_user_id;
    RAISE NOTICE '🗑️ Test user deleted';
    
    RAISE NOTICE '🎉 Database structure is correct!';
END $$;
