# Dockerfile для NestJS серверного приложения

FROM node:20-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Установка зависимостей
RUN npm ci

# Копирование исходного кода
COPY . .

# Генерация Prisma Client
RUN npx prisma generate

# Сборка приложения
RUN npm run build

# Открытие порта
EXPOSE 5000

# Команда запуска
CMD ["npm", "run", "start:prod"]

