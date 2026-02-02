    # ---------- build frontend ----------
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY client/package*.json ./
RUN npm ci

COPY client .
RUN npm run build

# ---------- runtime nginx ----------
FROM nginx:1.25-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=frontend-builder /app/dist /usr/share/nginx/html
