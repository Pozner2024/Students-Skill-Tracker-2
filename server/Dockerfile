FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src
COPY src/data ./src/data
COPY seed.ts ./seed.ts

# сборка NestJS
RUN npm run build

RUN ls -la dist
EXPOSE 3000

CMD ["node", "dist/src/main.js"]