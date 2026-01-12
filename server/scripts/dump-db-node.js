// Альтернативный скрипт для создания дампа базы данных PostgreSQL
// Использует Node.js и Prisma вместо pg_dump
// Не требует наличия pg_dump в PATH

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Получаем DATABASE_URL из переменных окружения
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Ошибка: DATABASE_URL не найден в переменных окружения');
  console.error('Убедитесь, что файл .env существует и содержит DATABASE_URL');
  process.exit(1);
}

// Парсим DATABASE_URL для получения имени БД
function parseDatabaseUrl(url) {
  try {
    const urlObj = new URL(url);
    return {
      database: urlObj.pathname.slice(1), // убираем первый слэш
    };
  } catch (error) {
    console.error('Ошибка при парсинге DATABASE_URL:', error.message);
    process.exit(1);
  }
}

const dbConfig = parseDatabaseUrl(databaseUrl);

// Создаем имя файла с датой и временем
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
const dumpFileName = `dump_${dbConfig.database}_${timestamp}.sql`;
const dumpsDir = path.join(__dirname, '..', 'dumps');

// Создаем папку для дампов, если её нет
if (!fs.existsSync(dumpsDir)) {
  fs.mkdirSync(dumpsDir, { recursive: true });
}

const dumpFilePath = path.join(dumpsDir, dumpFileName);

console.log('Создание дампа базы данных через Prisma...');
console.log(`База данных: ${dbConfig.database}`);
console.log(`Файл дампа: ${dumpFilePath}`);
console.log('');

// Создаем Prisma клиент
const prisma = new PrismaClient();

// Функция для экранирования SQL строк
function escapeSqlString(str) {
  if (str === null || str === undefined) {
    return 'NULL';
  }
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

// Функция для форматирования даты
function formatDate(date) {
  if (!date) return 'NULL';
  return "'" + date.toISOString().replace('T', ' ').slice(0, -1) + "'";
}

// Функция для экспорта данных таблицы
async function exportTable(tableName) {
  // Экранируем имя таблицы для безопасности
  const safeTableName = `"${tableName}"`;
  const rows = await prisma.$queryRawUnsafe(`SELECT * FROM ${safeTableName}`);
  const lines = [];
  
  if (rows.length === 0) {
    return `-- Таблица ${tableName} пуста\n`;
  }

  // Получаем структуру таблицы
  const columns = Object.keys(rows[0]);
  
  lines.push(`-- Данные таблицы ${tableName}\n`);
  lines.push(`-- Количество записей: ${rows.length}\n\n`);
  
  for (const row of rows) {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) {
        return 'NULL';
      }
      if (value instanceof Date) {
        return formatDate(value);
      }
      if (typeof value === 'object') {
        // JSON поля
        return escapeSqlString(JSON.stringify(value));
      }
      return escapeSqlString(String(value));
    });
    
    const safeColumns = columns.map(col => `"${col}"`).join(', ');
    lines.push(`INSERT INTO "${tableName}" (${safeColumns}) VALUES (${values.join(', ')});\n`);
  }
  
  lines.push('\n');
  return lines.join('');
}

// Основная функция создания дампа
async function createDump() {
  const writeStream = fs.createWriteStream(dumpFilePath, { encoding: 'utf8' });
  
  try {
    // Заголовок дампа
    writeStream.write(`-- PostgreSQL дамп базы данных\n`);
    writeStream.write(`-- Создан: ${new Date().toISOString()}\n`);
    writeStream.write(`-- База данных: ${dbConfig.database}\n`);
    writeStream.write(`-- Создано через Prisma (Node.js)\n\n`);
    writeStream.write(`SET statement_timeout = 0;\n`);
    writeStream.write(`SET lock_timeout = 0;\n`);
    writeStream.write(`SET idle_in_transaction_session_timeout = 0;\n`);
    writeStream.write(`SET client_encoding = 'UTF8';\n`);
    writeStream.write(`SET standard_conforming_strings = on;\n`);
    writeStream.write(`SELECT pg_catalog.set_config('search_path', '', false);\n\n`);
    
    // Экспортируем данные из всех таблиц
    console.log('Экспорт данных...');
    
    // Получаем список всех таблиц
    const tablesResult = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    // Преобразуем результат в массив имен таблиц
    const tables = Array.isArray(tablesResult) 
      ? tablesResult.map(t => {
          // Обрабатываем разные форматы результата
          if (typeof t === 'string') return t;
          return t.table_name || Object.values(t)[0];
        })
      : [];
    
    console.log(`Найдено таблиц: ${tables.length}`);
    
    for (const tableName of tables) {
      console.log(`  Экспорт таблицы: ${tableName}...`);
      
      try {
        const data = await exportTable(tableName);
        writeStream.write(data);
      } catch (error) {
        console.warn(`  Предупреждение: не удалось экспортировать ${tableName}:`, error.message);
        writeStream.write(`-- Ошибка при экспорте таблицы ${tableName}: ${error.message}\n\n`);
      }
    }
    
    writeStream.end();
    
    // Ждем завершения записи
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    // Проверяем размер файла
    const stats = fs.statSync(dumpFilePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('');
    console.log('✓ Дамп успешно создан!');
    console.log(`  Файл: ${dumpFilePath}`);
    console.log(`  Размер: ${fileSizeMB} MB`);
    console.log('');
    console.log('Примечание: Этот дамп содержит только данные (INSERT).');
    console.log('Для полного дампа со структурой используйте pg_dump.');
    
  } catch (error) {
    console.error('Ошибка при создании дампа:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем создание дампа
createDump().catch((error) => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
});

