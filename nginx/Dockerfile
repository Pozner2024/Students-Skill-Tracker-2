# ---------- build stage ----------
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    # копируем только package.json фронта
    COPY ../client/package*.json ./
    RUN npm ci
    
    # копируем исходники фронта
    COPY ../client .
    RUN npm run build
    
    
    # ---------- runtime stage ----------
    FROM nginx:1.25-alpine
    
    # удаляем дефолтный конфиг
    RUN rm /etc/nginx/conf.d/default.conf
    
    # кладём свой nginx.conf
    COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
    
    # копируем собранный фронт
    COPY --from=builder /app/dist /usr/share/nginx/html
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
    