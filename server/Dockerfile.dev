FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npm run build && npm run start:dev"]