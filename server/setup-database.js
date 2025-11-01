#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Настройка базы данных для Students Skill Tracker');
console.log('================================================');

// Проверяем, существует ли файл .env
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (fs.existsSync(envPath)) {
    console.log('✅ Файл .env уже существует');
} else {
    console.log('❌ Файл .env не найден');
    
    if (fs.existsSync(envExamplePath)) {
        console.log('📋 Копируем env.example в .env...');
        try {
            fs.copyFileSync(envExamplePath, envPath);
            console.log('✅ Файл .env создан из env.example');
            console.log('⚠️  Не забудьте обновить DATABASE_URL в файле .env с вашими реальными данными!');
        } catch (error) {
            console.error('❌ Ошибка при создании .env:', error.message);
        }
    } else {
        console.log('📝 Создаем новый файл .env...');
        const envContent = `# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/students_skill_tracker?schema=public"

# Замените следующие значения на ваши реальные данные:
# - username: ваш пользователь PostgreSQL (обычно postgres)
# - password: ваш пароль PostgreSQL
# - localhost:5432: хост и порт базы данных
# - students_skill_tracker: название базы данных
`;
        
        try {
            fs.writeFileSync(envPath, envContent);
            console.log('✅ Файл .env создан');
            console.log('⚠️  Не забудьте обновить DATABASE_URL в файле .env с вашими реальными данными!');
        } catch (error) {
            console.error('❌ Ошибка при создании .env:', error.message);
        }
    }
}

console.log('\n📋 Следующие шаги:');
console.log('1. Откройте файл .env и обновите DATABASE_URL с вашими данными');
console.log('2. Убедитесь, что PostgreSQL запущен');
console.log('3. Создайте базу данных (если еще не создана)');
console.log('4. Выполните: npx prisma generate');
console.log('5. Выполните: npx prisma db push');
console.log('\n🎉 Готово!');
