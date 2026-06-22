# ---------- build frontend (Vue 3 + Vite) ----------
FROM node:22.12-alpine AS frontend-builder

WORKDIR /app
COPY client-vue/package*.json ./
RUN npm ci

COPY client-vue .
RUN npm run build

# ---------- runtime nginx ----------
FROM nginx:1.25-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=frontend-builder /app/dist /usr/share/nginx/html
