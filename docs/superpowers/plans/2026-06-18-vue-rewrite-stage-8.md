# Этап 8 — Сборка и деплой (Vue-клиент) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переключить продакшн-раздачу статики с vanilla-клиента (`client/`) на новый Vue-клиент (`client-vue/`), проверить на проде konditer-app.pro, после успеха удалить старый `client/`.

**Architecture:** Прод поднят через `docker-compose.yml` (сервисы `db` + `server` + `nginx`). Контейнер `nginx` многостадийно собирает фронтенд (`frontend-builder`) и копирует `dist` в `nginx:alpine`. Меняется только стадия сборки фронтенда в `nginx/Dockerfile` (источник `client/` → `client-vue/`) и чистится мёртвый блок `natsdoll.com` в `nginx/nginx.conf`. `docker-compose.yml` не трогаем — он не ссылается на путь клиента.

**Tech Stack:** Vite 8 (vue-tsc + vite build), Node 22 (build-стадия), nginx 1.25-alpine, Docker Compose.

## Global Constraints

- Ветка `feat/vue-rewrite`. **Коммитим ТОЛЬКО локально, на GitHub НЕ пушим** — чтобы случайно не задеть прод-пайплайн.
- Точная копия поведения 1-в-1. Никаких новых фич, ребрендинга путей, изменения API.
- Прод-инфраструктура (konditer-app.pro / 185.128.104.205) общая, на ней крутятся и другие сайты под общим nginx. Любой шаг, выполняемый НА сервере, делается с участием пользователя и только после подтверждения. Детали сервера — в памяти `project-konditer-server`.
- SPA-роутинг Vue Router (history mode) обслуживается существующей директивой `try_files $uri $uri/ /index.html;` — её не меняем.
- Vite-сборка кладёт результат в `dist/` (дефолт), как ожидает `COPY --from=frontend-builder /app/dist`. Имя выходной папки не менять.

---

### Task 1: Локальная проверка прод-сборки Vue-клиента

Убедиться, что `client-vue` чисто собирается прод-сборкой ДО изменения Docker — чтобы отделить ошибки кода от ошибок докер-окружения.

**Files:**
- Не изменяет файлы (проверочная задача).

**Interfaces:**
- Consumes: существующий `client-vue/package.json` (скрипт `build` = `vue-tsc -b && vite build`).
- Produces: подтверждение, что `client-vue/dist/index.html` и ассеты генерируются без ошибок type-check/сборки.

- [ ] **Step 1: Прогнать прод-сборку**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2/client-vue" && npm run build
```

Expected: процесс завершается кодом 0; в конце Vite печатает таблицу с `dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`. Нет ошибок `vue-tsc`.

- [ ] **Step 2: Проверить артефакты сборки**

```bash
ls "D:/Наташа/Students-Skill-Tracker-2/client-vue/dist" && ls "D:/Наташа/Students-Skill-Tracker-2/client-vue/dist/assets" | head
```

Expected: присутствует `index.html` и непустая папка `assets/` с хешированными `.js`/`.css`.

- [ ] **Step 3: (опц.) Локальный smoke-просмотр статики**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2/client-vue" && npm run preview
```

Expected: Vite preview поднимается (обычно `http://localhost:4173`). Открыть в браузере — отдаётся `/login` (без бэкенда API упадёт, это норм; проверяем только что статика грузится и роутер работает). Остановить `Ctrl+C`.

Эта задача без коммита — артефакт `dist/` в git не попадает (он в `.gitignore`).

---

### Task 2: Добавить `.dockerignore` для контекста сборки nginx

Build-контекст образа nginx — корень репозитория (`context: .` в compose). Без `.dockerignore` в контекст утягиваются `node_modules`, `dist`, `.git` обоих клиентов и сервера — это раздувает контекст и риск перезаписать `npm ci`-результат host-овыми `node_modules`. Добавляем игнор.

**Files:**
- Create: `.dockerignore`

**Interfaces:**
- Consumes: структура репо (`client/`, `client-vue/`, `server/`, `nginx/`).
- Produces: чистый build-контекст для стадии `frontend-builder` (Task 3).

- [ ] **Step 1: Создать `.dockerignore` в корне**

Создать файл `D:/Наташа/Students-Skill-Tracker-2/.dockerignore`:

```
**/node_modules
**/dist
**/.git
**/.vite
**/cypress/screenshots
**/cypress/videos
**/.env
**/.env.*
!.env.docker
```

> `!.env.docker` оставлен явно, т.к. compose читает `.env.docker` через `env_file`; но в build-контекст nginx он не нужен — строка-исключение безвредна и страхует от случайного игнора нужного файла на уровне compose. Server-стадия и nginx-стадия `.env` не используют, секреты приходят рантаймом через `env_file`.

- [ ] **Step 2: Проверить, что игнор не ломает существующую сборку server**

`server/Dockerfile` копирует `server/` и сам делает `npm ci` — исключение `**/node_modules`/`**/dist` ему не вредит (он их и так не ждёт из контекста).

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && docker compose build server
```

Expected: образ `server` собирается успешно (код 0).

- [ ] **Step 3: Commit**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2"
git add .dockerignore
git commit -m "chore(deploy): dobavlen .dockerignore dlya build-konteksta"
```

---

### Task 3: Переключить `nginx/Dockerfile` на сборку `client-vue`

Главное изменение этапа: стадия `frontend-builder` собирает Vue-клиент вместо vanilla. Также поднимаем Node до 22 (Vite 8 требует Node 20.19+ || 22.12+; `node:22-alpine` гарантированно подходит).

**Files:**
- Modify: `nginx/Dockerfile`

**Interfaces:**
- Consumes: `client-vue/package*.json`, исходники `client-vue/`, скрипт `npm run build` (= `vue-tsc -b && vite build`), выход в `/app/dist`.
- Produces: образ nginx со статикой Vue-клиента в `/usr/share/nginx/html`.

- [ ] **Step 1: Переписать `nginx/Dockerfile`**

Заменить весь файл `D:/Наташа/Students-Skill-Tracker-2/nginx/Dockerfile` на:

```dockerfile
# ---------- build frontend (Vue 3 + Vite) ----------
FROM node:22-alpine AS frontend-builder

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
```

> Изменения относительно старого: `node:20-alpine`→`node:22-alpine`; `client`→`client-vue` в двух `COPY`. Стадия runtime не изменилась.

- [ ] **Step 2: Собрать образ nginx локально**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && docker compose build nginx
```

Expected: сборка проходит до конца (код 0). В логах видно `npm ci`, затем `vue-tsc -b && vite build` со сводной таблицей ассетов, затем копирование в nginx. Нет ошибок type-check.

- [ ] **Step 3: Проверить, что статика Vue реально попала в образ**

```bash
docker create --name stage8-check students-skill-tracker-2-nginx
docker cp stage8-check:/usr/share/nginx/html/index.html - | tar -xO 2>/dev/null | head -20
docker rm stage8-check
```

> Имя образа `students-skill-tracker-2-nginx` — дефолт compose из имени папки; при расхождении взять имя из `docker compose images nginx`.

Expected: `index.html` содержит подключение Vite-ассетов (`<script type="module" ... /assets/...>`), а НЕ webpack-бандлы старого клиента.

- [ ] **Step 4: Commit**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2"
git add nginx/Dockerfile
git commit -m "feat(deploy): nginx sobiraet client-vue vmesto client (Node 22)"
```

---

### Task 4: Убрать мёртвые блоки `natsdoll.com` из `nginx/nginx.conf`

На проде natsdoll зачищен ([[project-natsdoll-cleanup]]): сертификат `/etc/letsencrypt/live/natsdoll.com/` удалён, стек `new_project` снесён. Текущий `nginx.conf` всё ещё ссылается на этот сертификат и проксирует на `host.docker.internal:8081`. Если пересобрать/перезапустить контейнер nginx с этим конфигом — nginx упадёт на старте (`cannot load certificate ... No such file or directory`). Удаляем оба natsdoll-блока (80 и 443). Блоки konditer-app.pro не трогаем.

**Files:**
- Modify: `nginx/nginx.conf`

**Interfaces:**
- Consumes: существующая конфигурация konditer-app.pro (редирект 80→443, ssl, `location /` SPA-fallback, `location /api/` → `server:3000`).
- Produces: конфиг только для konditer-app.pro, без ссылок на отсутствующий natsdoll-сертификат.

- [ ] **Step 1: Удалить natsdoll-редирект на 80 порту**

Удалить из `D:/Наташа/Students-Skill-Tracker-2/nginx/nginx.conf` блок:

```nginx
server {
    listen 80;
    server_name natsdoll.com www.natsdoll.com;

    return 301 https://$host$request_uri;
}
```

- [ ] **Step 2: Удалить natsdoll 443-блок**

Удалить из того же файла блок:

```nginx
server {
    listen 443 ssl;
    server_name natsdoll.com www.natsdoll.com;

    ssl_certificate     /etc/letsencrypt/live/natsdoll.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/natsdoll.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://host.docker.internal:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

После удаления в файле остаются ровно два `server`-блока: redirect-80 и ssl-443 для konditer-app.pro.

- [ ] **Step 3: Пересобрать nginx и проверить валидность конфига**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && docker compose build nginx
docker run --rm --entrypoint nginx students-skill-tracker-2-nginx -t -c /etc/nginx/conf.d/default.conf
```

Expected: `nginx -t` печатает `syntax is ok` / `test is successful` ИЛИ ругается только на отсутствие основного `nginx.conf` include-контекста (т.к. файл лежит как `conf.d/default.conf`). Главное — нет упоминаний natsdoll и синтаксис валиден. При шуме от изолированного запуска достаточно `grep` ниже как доказательства чистоты.

- [ ] **Step 4: Убедиться, что natsdoll не осталось в конфиге образа**

```bash
docker run --rm --entrypoint sh students-skill-tracker-2-nginx -c "grep -c natsdoll /etc/nginx/conf.d/default.conf || echo 0"
```

Expected: `0`.

- [ ] **Step 5: Commit**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2"
git add nginx/nginx.conf
git commit -m "fix(deploy): udaleny mertvye natsdoll-bloki iz nginx.conf"
```

---

### Task 5: Локальный полный smoke прод-стека (db + server + nginx)

Поднять весь стек локально как на проде и проверить, что Vue-клиент отдаётся и говорит с API. Требует наличия `.env.docker` локально (см. `.env.example`). Если `.env.docker` локально нет — этот шаг выполняется на сервере в Task 6, а локально ограничиваемся проверкой статики из Task 3/4.

**Files:**
- Не изменяет файлы (проверочная задача).

**Interfaces:**
- Consumes: образы из Task 3/4, `.env.docker`.
- Produces: подтверждение, что прод-конфигурация поднимается и Vue-клиент рабочий.

- [ ] **Step 1: Проверить наличие `.env.docker`**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && test -f .env.docker && echo "EST" || echo "NET — propustit' lokal'nyj stack, delat' na servere"
```

Expected: `EST` или `NET`. При `NET` — пропустить Task 5, перейти к Task 6 (проверка на сервере).

- [ ] **Step 2: Поднять стек**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && docker compose up -d --build
docker compose ps
```

Expected: все три сервиса (`db`, `server`, `nginx`) в состоянии `running`/`healthy`. nginx НЕ в состоянии restart-loop (если перезапускается — смотреть `docker compose logs nginx`, чаще всего сертификаты: локально их нет по `/etc/letsencrypt`).

> Прим.: локально 443-блок konditer-app.pro не получит сертификаты (том `/etc/letsencrypt` пуст на dev-машине), nginx может падать на ssl. Для чисто локальной проверки статики допустимо временно открыть `http://localhost` только если есть отдельный http-локейшн; иначе полноценную проверку TLS делаем на сервере (Task 6). Не коммитить локальные обходы.

- [ ] **Step 3: Проверить отдачу клиента (если стек поднялся)**

```bash
curl -sk https://localhost/ | grep -o 'type="module"' | head -1
curl -sk https://localhost/api/topics -o /dev/null -w "%{http_code}\n"
```

Expected: первая команда печатает `type="module"` (Vite-сборка отдаётся); вторая — HTTP-код от API (401/200 — значит проксирование `/api/` живо).

- [ ] **Step 4: Погасить локальный стек**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && docker compose down
```

Expected: контейнеры остановлены и удалены. Том `db_data` сохраняется.

Без коммита — проверочная задача.

---

### Task 6: Деплой на прод konditer-app.pro (с участием пользователя)

⚠️ **Затрагивает живой прод и общий nginx для нескольких сайтов.** Выполняется ВМЕСТЕ с пользователем, по шагам, с подтверждением на каждом. Не выполнять автономно.

**Files:**
- Не изменяет файлы репозитория (операции на сервере).

**Interfaces:**
- Consumes: ветка `feat/vue-rewrite` с коммитами Task 2–4, доступ по SSH к серверу, `.env.docker` на сервере.
- Produces: прод раздаёт Vue-клиент; konditer-app.pro работает 1-в-1.

- [ ] **Step 1: Согласовать стратегию доставки кода на сервер**

Уточнить у пользователя, как код попадает на прод (исторически ветка локальная, не пушится в GitHub). Варианты: временный приватный push в защищённую ветку + `git pull` на сервере; `scp`/`rsync` рабочей копии; ручной перенос изменённых файлов (`nginx/Dockerfile`, `nginx/nginx.conf`, `.dockerignore`). Выбрать с пользователем, не угадывать.

- [ ] **Step 2: Резервная точка отката**

На сервере, до перезапуска, зафиксировать текущее состояние, чтобы можно было откатиться:

```bash
# на сервере, в каталоге проекта
git rev-parse HEAD            # запомнить текущий коммит
docker compose images nginx   # запомнить текущий image id
```

Expected: записан коммит и image id для отката.

- [ ] **Step 3: Пересобрать и поднять nginx на сервере**

```bash
# на сервере
docker compose build nginx
docker compose up -d nginx
docker compose ps
docker compose logs --tail=30 nginx
```

Expected: nginx `running`, без restart-loop, в логах нет ошибок сертификатов natsdoll (их и не должно быть после Task 4).

- [ ] **Step 4: Прод-проверка 1-в-1 (с пользователем)**

В браузере на `https://konditer-app.pro`: `/login` → вход → каталог тем → прохождение теста → личный кабинет → админка (CKEditor). Сверить с ожидаемым поведением. Проверить, что другие сайты на общем nginx живы.

```bash
curl -sI https://konditer-app.pro/ | head -3
curl -s https://konditer-app.pro/ | grep -o 'type="module"' | head -1
```

Expected: 200/корректные заголовки; `type="module"` присутствует (Vue-сборка).

- [ ] **Step 5: При проблемах — откат**

Если что-то сломалось: вернуть прежний образ/коммит nginx и пересобрать из старого `nginx/Dockerfile` (источник `client/`). Зафиксировать с пользователем причину до повторной попытки.

Без коммита в репо — серверная операция. Зафиксировать результат в памяти `project-vue-migration`.

---

### Task 7: Удалить старый vanilla-клиент `client/`

Только ПОСЛЕ успешного и подтверждённого прода (Task 6). Удаляем старый клиент и его упоминания в документации.

**Files:**
- Delete: вся папка `client/`
- Modify: `CLAUDE.md` (убрать описание vanilla-клиента как «текущего», зафиксировать Vue как единственный клиент)

**Interfaces:**
- Consumes: подтверждение из Task 6, что прод стабильно работает на Vue.
- Produces: репозиторий с единственным клиентом `client-vue/`.

- [ ] **Step 1: Финальная проверка, что на `client/` ничего не завязано в деплое**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && grep -rn "client/" --include=Dockerfile --include=*.yml --include=*.yaml --include=*.conf . | grep -v "client-vue"
```

Expected: пустой вывод (после Task 3 деплой ссылается только на `client-vue`). Если что-то найдено — исправить до удаления.

- [ ] **Step 2: Удалить папку `client/`**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git rm -r client
```

Expected: git помечает все файлы `client/` к удалению.

- [ ] **Step 3: Обновить `CLAUDE.md`**

В `CLAUDE.md` привести описание клиента к актуальному: убрать формулировки «сейчас vanilla JS на webpack» / «миграция идёт» / «старый client/ остаётся рабочим», заменить на то, что клиент — `client-vue/` (Vue 3 + Vite + TS), миграция завершена. Раздел «Команды → Клиент (vanilla)» удалить, оставить только команды `client-vue/`. Раздел «Архитектура → Клиент (client/) — vanilla JS» удалить.

> Конкретные строки правок зависят от итогового текста CLAUDE.md на момент задачи; ориентир — все упоминания `client/` как активного клиента и webpack-vanilla должны исчезнуть.

- [ ] **Step 4: Проверить, что деплой всё ещё собирается без `client/`**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && docker compose build nginx
```

Expected: образ собирается (он зависит только от `client-vue/`), код 0.

- [ ] **Step 5: Commit**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2"
git add -A
git commit -m "chore: udalen staryj vanilla-klient client/, CLAUDE.md aktualizirovan"
```

---

### Task 8: Зафиксировать завершение миграции в памяти

**Files:**
- Modify: `C:/Users/user/.claude/projects/D---------Students-Skill-Tracker-2/memory/project_vue_migration.md`

- [ ] **Step 1: Обновить статус**

Отметить Этап 8 как выполненный (с датой), зафиксировать: nginx раздаёт `client-vue`, natsdoll-блоки убраны из конфига, старый `client/` удалён, прод проверен. При необходимости обновить `MEMORY.md`-строку.

- [ ] **Step 2: (опц.) Финализация ветки**

Предложить пользователю опции через superpowers:finishing-a-development-branch (merge в main / оставить как есть). Решение о пуше/мердже — за пользователем (прод-защита).

---

## Self-Review

**Spec coverage** (спека: «Vite-сборка; обновить `nginx/Dockerfile` и `docker-compose.yml`, чтобы раздавать `client-vue/dist`; проверить на сервере; после успеха удалить старый `client/`»):
- Vite-сборка → Task 1 (локальная проверка) + Task 3 (в образе).
- Обновить `nginx/Dockerfile` → Task 3. ✅
- Обновить `docker-compose.yml` → **намеренное отклонение от спеки**: compose не ссылается на путь клиента (`context: .`, `dockerfile: nginx/Dockerfile`), менять нечего. Зафиксировано в Architecture. Дополнительно вскрыт незапланированный спекой, но необходимый для рабочего деплоя пункт — чистка natsdoll (Task 4) и `.dockerignore` (Task 2).
- Проверить на сервере → Task 5 (локально) + Task 6 (прод). ✅
- Удалить старый `client/` → Task 7. ✅

**Placeholder scan:** код-шаги содержат полные файлы/блоки. Task 7 Step 3 (правка CLAUDE.md) описан без точных строк сознательно — текст файла может измениться к моменту выполнения; дан чёткий критерий результата.

**Type/path consistency:** имя образа `students-skill-tracker-2-nginx` использовано единообразно с оговоркой про `docker compose images`. Выходная папка `dist` согласована между Vite-дефолтом и `COPY --from=frontend-builder /app/dist`. Источник `client-vue` единообразен в Dockerfile и проверках.
