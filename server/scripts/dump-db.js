// Скрипт для создания дампа базы данных PostgreSQL
// Использует pg_dump для создания SQL-дампов
// Читает DATABASE_URL из переменных окружения
// Если pg_dump не найден, автоматически переключается на альтернативный метод

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Получаем DATABASE_URL из переменных окружения
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Ошибка: DATABASE_URL не найден в переменных окружения');
  console.error('Убедитесь, что файл .env существует и содержит DATABASE_URL');
  process.exit(1);
}

// Парсим DATABASE_URL
// Формат: postgresql://user:password@host:port/database
function parseDatabaseUrl(url) {
  try {
    const urlObj = new URL(url);
    return {
      user: urlObj.username,
      password: urlObj.password,
      host: urlObj.hostname,
      port: urlObj.port || '5432',
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

// Формируем команду pg_dump
// Используем переменную окружения PGPASSWORD для пароля
const pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p -f "${dumpFilePath}"`;

console.log('Создание дампа базы данных...');
console.log(`База данных: ${dbConfig.database}`);
console.log(`Хост: ${dbConfig.host}:${dbConfig.port}`);
console.log(`Пользователь: ${dbConfig.user}`);
console.log(`Файл дампа: ${dumpFilePath}`);
console.log('');

// Устанавливаем переменную окружения для пароля
process.env.PGPASSWORD = dbConfig.password;

// Сначала проверяем, доступен ли pg_dump
exec('pg_dump --version', (versionError) => {
  if (versionError) {
    console.warn('⚠ pg_dump не найден в PATH');
    console.warn('Переключение на альтернативный метод через Prisma...');
    console.log('');
    
    // Запускаем альтернативный скрипт
    const altScript = path.join(__dirname, 'dump-db-node.js');
    const { spawn } = require('child_process');
    const nodeProcess = spawn('node', ['--env-file=.env', altScript], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..'),
    });
    
    nodeProcess.on('close', (code) => {
      process.exit(code);
    });
    
    return;
  }
  
  // Если pg_dump доступен, используем его
  console.log('Использование pg_dump...');
  console.log('');
  
  // Выполняем команду pg_dump
  exec(pgDumpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('Ошибка при создании дампа:');
      console.error(error.message);
      if (stderr) {
        console.error('Детали ошибки:');
        console.error(stderr);
      }
      console.error('');
      console.error('Попробуйте использовать альтернативный метод:');
      console.error('  npm run db:dump:node');
      console.error('');
      console.error('Или убедитесь, что:');
      console.error('  1. PostgreSQL установлен и pg_dump доступен в PATH');
      console.error('  2. База данных запущена и доступна');
      console.error('  3. У пользователя есть права на чтение базы данных');
      process.exit(1);
    }

    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('Предупреждения:');
      console.warn(stderr);
    }

    // Проверяем, что файл создан
    if (fs.existsSync(dumpFilePath)) {
      const stats = fs.statSync(dumpFilePath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log('✓ Дамп успешно создан!');
      console.log(`  Файл: ${dumpFilePath}`);
      console.log(`  Размер: ${fileSizeMB} MB`);
    } else {
      console.error('Ошибка: файл дампа не был создан');
      process.exit(1);
    }
  });
});

