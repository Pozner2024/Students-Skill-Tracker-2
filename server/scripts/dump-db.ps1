# PowerShell скрипт для создания дампа базы данных PostgreSQL
# Альтернативный вариант для Windows

# Загружаем переменные окружения из .env файла
$envFile = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "Ошибка: файл .env не найден" -ForegroundColor Red
    Write-Host "Путь: $envFile" -ForegroundColor Yellow
    exit 1
}

# Читаем DATABASE_URL из .env
$databaseUrl = ""
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^DATABASE_URL=(.+)$") {
        $databaseUrl = $matches[1].Trim()
    }
}

if (-not $databaseUrl) {
    Write-Host "Ошибка: DATABASE_URL не найден в .env файле" -ForegroundColor Red
    exit 1
}

# Парсим DATABASE_URL
try {
    $uri = [System.Uri]$databaseUrl
    $user = $uri.UserInfo.Split(':')[0]
    $password = $uri.UserInfo.Split(':')[1]
    $host = $uri.Host
    $port = if ($uri.Port -ne -1) { $uri.Port } else { 5432 }
    $database = $uri.AbsolutePath.TrimStart('/')
} catch {
    Write-Host "Ошибка при парсинге DATABASE_URL: $_" -ForegroundColor Red
    exit 1
}

# Создаем имя файла с датой и временем
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$dumpFileName = "dump_${database}_${timestamp}.sql"
$dumpsDir = Join-Path $PSScriptRoot "..\dumps"

# Создаем папку для дампов, если её нет
if (-not (Test-Path $dumpsDir)) {
    New-Item -ItemType Directory -Path $dumpsDir | Out-Null
}

$dumpFilePath = Join-Path $dumpsDir $dumpFileName

Write-Host "Создание дампа базы данных..." -ForegroundColor Cyan
Write-Host "База данных: $database" -ForegroundColor Yellow
Write-Host "Хост: ${host}:${port}" -ForegroundColor Yellow
Write-Host "Пользователь: $user" -ForegroundColor Yellow
Write-Host "Файл дампа: $dumpFilePath" -ForegroundColor Yellow
Write-Host ""

# Устанавливаем переменную окружения для пароля
$env:PGPASSWORD = $password

# Выполняем pg_dump
try {
    $pgDumpPath = Get-Command pg_dump -ErrorAction Stop | Select-Object -ExpandProperty Source
    & $pgDumpPath -h $host -p $port -U $user -d $database -F p -f $dumpFilePath
    
    if (Test-Path $dumpFilePath) {
        $fileSize = (Get-Item $dumpFilePath).Length / 1MB
        Write-Host "✓ Дамп успешно создан!" -ForegroundColor Green
        Write-Host "  Файл: $dumpFilePath" -ForegroundColor Green
        Write-Host "  Размер: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
    } else {
        Write-Host "Ошибка: файл дампа не был создан" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Ошибка при создании дампа:" -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
    Write-Host ""
    Write-Host "Убедитесь, что:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL установлен и pg_dump доступен в PATH" -ForegroundColor Yellow
    Write-Host "  2. База данных запущена и доступна" -ForegroundColor Yellow
    Write-Host "  3. У пользователя есть права на чтение базы данных" -ForegroundColor Yellow
    exit 1
} finally {
    # Очищаем переменную окружения с паролем
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

