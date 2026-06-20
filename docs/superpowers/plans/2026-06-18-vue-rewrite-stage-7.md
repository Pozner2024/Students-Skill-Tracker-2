# Этап 7: Cypress e2e (mock-режим) + сквозная сверка — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Поднять Cypress в `client-vue/` и написать самодостаточные e2e-спеки в mock-режиме (без бэкенда), проверяющие ключевые сценарии нового клиента: вход, каталог тем, прохождение теста, экран итогов — поведение, эквивалентное старым спекам `auth` / `test-flow` / `test-result`.

**Architecture:** Cypress 13, baseUrl = vite dev (`http://localhost:5173`). Спеки полностью самодостаточны: весь `/api/*` мокируется через `cy.intercept` (НЕ используем `cy.request`, который бьёт в реальный бэкенд мимо моков). Селекторы — под фактический DOM нового клиента (`#email`, `#password`, кнопка «Войти», `#topics-section`, `#questions-panel .question[data-question-index]`, `#nextButton`, `#finishButton`, `.progress-container`). Запуск: поднять vite dev → `cypress run` → остановить dev.

**Tech Stack:** Cypress 13 (.cy.js), Vite dev-сервер, Vue 3 client-vue.

## Global Constraints

- Весь код — в `client-vue/`. `client/` и `server/` НЕ менять.
- Спеки **самодостаточны**: только `cy.intercept`, без `cy.request` и без зависимости от seed-данных/бэкенда.
- Токен-ключ авторизации — `auth_token` (как в `tokenStorage.ts`), выставляется через `onBeforeLoad`.
- Селекторы — строго по DOM нового клиента (см. ниже), без `.center`/анимационных классов (их в новом клиенте нет — переход карточки сделан через `:key`).
- Cypress-артефакты (`cypress/videos`, `cypress/screenshots`, `cypress/downloads`) — в `.gitignore`.
- ESLint не должен падать на cypress-спеках (добавить `cypress/**` в ignores flat-config).
- Ветка `feat/vue-rewrite`, коммиты только локально, на GitHub НЕ пушим.
- В конце: `cypress run` зелёный; `type-check`, `build`, `lint` (по `src/`) — без ошибок.

## Перенос и осознанные решения по объёму

| Старый спек | Новый спек (client-vue) | Решение |
|---|---|---|
| `auth.cy.js` | `cypress/e2e/auth.cy.js` | адаптирован: селекторы логина нового клиента |
| `test-flow.cy.js` | `cypress/e2e/test-flow.cy.js` | mock с непустыми images (data-URL), чтобы `.question-image img` отрисовался |
| `test-result.cy.js` | `cypress/e2e/test-result.cy.js` | убран `cy.request`; используем `mockTest` напрямую; хелперы под DOM без `.center` |
| `test-images.cy.js`, `test-result-15.cy.js`, `test-result-1-5-10.cy.js`, `test-result-all.cy.js`, `test-result-15-all.cy.js` | — | **вне объёма**: чисто real-backend (используют `cy.request` к реальным тестам 1/5/10/15 вопросов + изображения S3). Это «полный порт», отклонён пользователем. Сверка этих путей уже сделана вручную через Playwright на Этапах 4–6. |

**Осознанные решения:**
- Не используем `cy.request` — он не перехватывается `cy.intercept` и требует реального сервера. Все данные задаём моками.
- Не проверяем slide-анимацию/`.center` (в новом клиенте карточка вопроса перемонтируется через `:key`, без vanilla-классов перехода). Проверяем поведение: вопрос виден, ответ принимается, навигация работает, итог считается.
- ordering в mock-спеках не покрываем (в `mockTest` его нет; HTML5-DnD проверен вручную на Этапе 5). multiple_choice / fill_in_the_blank / matching — покрываем.

---

## Структура файлов (создаётся в этом этапе)

```
client-vue/
├─ cypress.config.ts
├─ cypress/
│  ├─ support/e2e.js
│  └─ e2e/
│     ├─ auth.cy.js
│     ├─ test-flow.cy.js
│     └─ test-result.cy.js
├─ package.json        (+ devDep cypress, скрипты e2e)
├─ .gitignore          (+ cypress артефакты)
└─ eslint.config.ts    (+ ignores cypress/**)
```

---

## Task 1: Установка и настройка Cypress

**Files:**
- Modify: `client-vue/package.json` (через npm + скрипты)
- Create: `client-vue/cypress.config.ts`
- Create: `client-vue/cypress/support/e2e.js`
- Modify: `client-vue/.gitignore`
- Modify: `client-vue/eslint.config.ts`

**Interfaces:**
- Produces: рабочая конфигурация Cypress (baseUrl 5173), npm-скрипты `e2e:open` / `e2e:run`.

- [ ] **Step 1: Установить Cypress**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2/client-vue" && npm install -D cypress@^13
```
Ожидаемо: пакет добавлен в devDependencies.

- [ ] **Step 2: Создать `client-vue/cypress.config.ts`**

```ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    env: {
      E2E_EMAIL: 'student@example.com',
      E2E_PASSWORD: 'Password123!',
    },
  },
})
```

- [ ] **Step 3: Создать `client-vue/cypress/support/e2e.js`**

```js
// Глобальные хуки Cypress.
// Подавляем падение тестов из-за посторонних ошибок страницы (HMR/антивирус/CKEditor warnings).
Cypress.on('uncaught:exception', () => false)
```

- [ ] **Step 4: Добавить скрипты в `client-vue/package.json`**

В раздел `"scripts"` добавить:
```json
    "e2e:open": "cypress open",
    "e2e:run": "cypress run"
```

- [ ] **Step 5: Добавить артефакты Cypress в `client-vue/.gitignore`**

В конец файла добавить:
```
# Cypress
cypress/videos/
cypress/screenshots/
cypress/downloads/
```

- [ ] **Step 6: Исключить cypress из ESLint в `client-vue/eslint.config.ts`**

Найти объект с `ignores` (обычно `{ ignores: ['dist', ...] }`) и добавить `'cypress/**'` в массив. Если такого объекта нет — добавить первым элементом экспорта:
```ts
  { ignores: ['cypress/**'] },
```

- [ ] **Step 7: Проверить, что Cypress установлен**

```bash
cd client-vue && npx cypress verify
```
Ожидаемо: «Cypress verified».

- [ ] **Step 8: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "chore: nastrojka Cypress v client-vue (baseUrl 5173, mock-rezhim)"
```

---

## Task 2: e2e — аутентификация и каталог

**Files:**
- Create: `client-vue/cypress/e2e/auth.cy.js`

**Interfaces:**
- Consumes: vite dev на :5173; моки `/api/auth/login`, `/api/users/profile`, `/api/topics`.

- [ ] **Step 1: Создать `client-vue/cypress/e2e/auth.cy.js`**

```js
const topicsResponse = {
  success: true,
  topics: [{ id: 1, name: 'Основы кондитерского дела', project: { name: 'Проект 1' } }],
}

describe('Аутентификация', () => {
  it('перенаправляет на /login без авторизации', () => {
    cy.visit('/')
    cy.location('pathname').should('eq', '/login')
    cy.get('#email').should('be.visible')
    cy.get('#password').should('be.visible')
    cy.contains('button', 'Войти').should('be.visible')
  })

  it('логинится и показывает каталог тем', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { access_token: 'test-token', user: { id: 1, email: 's@e.com', role: 'student' } },
    }).as('login')
    cy.intercept('GET', '**/api/users/profile', {
      statusCode: 200,
      body: { id: 1, email: 's@e.com', role: 'student' },
    }).as('profile')
    cy.intercept('GET', '**/api/topics', { statusCode: 200, body: topicsResponse }).as('topics')

    cy.visit('/login')
    cy.get('#email').type('s@e.com')
    cy.get('#password').type('Password123!')
    cy.contains('button', 'Войти').click()

    cy.wait('@login')
    cy.location('pathname', { timeout: 10000 }).should('eq', '/')
    cy.get('#topics-section', { timeout: 10000 }).should('exist')
    cy.contains('Основы кондитерского дела').should('be.visible')
  })
})
```

- [ ] **Step 2: Прогнать спек (в отдельном терминале поднят vite dev — см. Task 5 Step 1; для одиночной проверки запустить dev вручную)**

```bash
cd client-vue && npm run dev > /tmp/vite-e2e.log 2>&1 &
sleep 6 && npx cypress run --spec cypress/e2e/auth.cy.js
```
Ожидаемо: 2 теста PASS. После — остановить dev (PowerShell Stop-Process по vite-node).

- [ ] **Step 3: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "test(e2e): auth.cy.js (login + katalog) mock"
```

---

## Task 3: e2e — прохождение теста (рендер вопросов)

**Files:**
- Create: `client-vue/cypress/e2e/test-flow.cy.js`

**Interfaces:**
- Consumes: моки `/api/users/profile`, `/api/topics`, `/api/images/**` (непустые — data-URL), `/api/tests/test*`.

- [ ] **Step 1: Создать `client-vue/cypress/e2e/test-flow.cy.js`**

```js
const PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const testResponse = {
  testTitle: 'Тест по теме',
  variant: 1,
  questions: [
    { type: 'multiple_choice', question: 'Сколько будет 2 + 2?', options: ['3', '4', '5'] },
    { type: 'fill_in_the_blank', question: '___ является основой теста.' },
  ],
}

describe('Прохождение теста', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/users/profile', {
      statusCode: 200,
      body: { id: 1, email: 's@e.com', role: 'student' },
    }).as('profile')
    cy.intercept('GET', '**/api/topics', {
      statusCode: 200,
      body: { success: true, topics: [{ id: 1, name: 'Тема' }] },
    }).as('topics')
    cy.intercept('GET', '**/api/images/**', {
      statusCode: 200,
      body: { success: true, images: { 1: PIXEL } },
    }).as('images')
    cy.intercept('GET', '**/api/tests/test*', { statusCode: 200, body: testResponse }).as('test')
  })

  it('открывает тест и рендерит вопросы и изображение', () => {
    cy.visit('/test-page?variant=1&testCode=test1_1&title=%D0%A2%D0%B5%D0%BC%D0%B0', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', 'test-token')
      },
    })

    cy.location('pathname', { timeout: 10000 }).should('eq', '/test-page')
    cy.get('#questions-panel .question-text', { timeout: 20000 }).should('be.visible')
    cy.get('#questions-panel .question-image img', { timeout: 20000 }).should('exist')
    cy.contains('Вопрос 1 из 2').should('be.visible')
  })
})
```

- [ ] **Step 2: Прогнать спек**

```bash
cd client-vue && npx cypress run --spec cypress/e2e/test-flow.cy.js
```
Ожидаемо: 1 тест PASS (vite dev должен быть поднят).

- [ ] **Step 3: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "test(e2e): test-flow.cy.js (render voprosov + kartinka) mock"
```

---

## Task 4: e2e — результат теста (ответы → итоги)

**Files:**
- Create: `client-vue/cypress/e2e/test-result.cy.js`

**Interfaces:**
- Consumes: моки `/api/users/profile`, `/api/tests/test*`, `/api/images/**`, `POST /api/test-results`.

- [ ] **Step 1: Создать `client-vue/cypress/e2e/test-result.cy.js`**

```js
const PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

// 10 вопросов нужно для ненулевой шкалы баллов (scales[10]).
const questions = [
  { type: 'multiple_choice', question: 'Столица Беларуси?', options: ['Минск', 'Рим'], correct_answer: 'Минск' },
  { type: 'multiple_choice', question: '2 + 2?', options: ['3', '4'], correct_answer: '4' },
  { type: 'multiple_choice', question: 'Цвет неба?', options: ['синий', 'красный'], correct_answer: 'синий' },
  { type: 'multiple_choice', question: 'Сахар сладкий?', options: ['да', 'нет'], correct_answer: 'да' },
  { type: 'fill_in_the_blank', question: 'Столица Франции — ___.', correct_answers: ['Париж'] },
  { type: 'fill_in_the_blank', question: 'Дважды два — ___.', correct_answers: ['четыре'] },
  { type: 'fill_in_the_blank', question: 'Антоним «день» — ___.', correct_answers: ['ночь'] },
  { type: 'fill_in_the_blank', question: 'Вода это H2___.', correct_answers: ['O'] },
  {
    type: 'matching',
    question: 'Страна и столица',
    left_column: ['Беларусь', 'Италия'],
    right_column: ['Минск', 'Рим'],
    correct_matches: { Беларусь: 'Минск', Италия: 'Рим' },
  },
  { type: 'multiple_choice', question: 'Лёд холодный?', options: ['да', 'нет'], correct_answer: 'да' },
]

const mockTest = {
  testCode: 'test1_1',
  testTitle: 'Тема: Тестовые вопросы',
  variant: 1,
  questions: { questions },
}

function answerQuestion(q, index) {
  cy.get(`#questions-panel .question[data-question-index="${index}"]`, { timeout: 20000 })
    .should('be.visible')
    .within(() => {
      if (q.type === 'multiple_choice') {
        cy.get('input[type="radio"]').check(q.correct_answer, { force: true })
      } else if (q.type === 'fill_in_the_blank') {
        q.correct_answers.forEach((ans, i) => {
          cy.get('input[type="text"]').eq(i).clear().type(String(ans))
        })
      } else if (q.type === 'matching') {
        q.left_column.forEach((left) => {
          cy.contains('li', left).find('select').select(q.correct_matches[left])
        })
      }
    })
}

describe('Результат теста', () => {
  it('отвечает правильно и показывает итоги', () => {
    cy.intercept('GET', '**/api/users/profile', {
      statusCode: 200,
      body: { id: 1, email: 's@e.com', role: 'student' },
    }).as('profile')
    cy.intercept('GET', '**/api/images/**', {
      statusCode: 200,
      body: { success: true, images: { 1: PIXEL } },
    }).as('images')
    cy.intercept('GET', '**/api/tests/test*', {
      statusCode: 200,
      body: {
        testCode: mockTest.testCode,
        testTitle: mockTest.testTitle,
        variant: mockTest.variant,
        questions: mockTest.questions,
      },
    }).as('test')
    cy.intercept('POST', '**/api/test-results', {
      statusCode: 200,
      body: { result: { max_points: 100, grade: 10 } },
    }).as('saveResult')

    cy.visit('/test-page?variant=1&testCode=test1_1&title=%D0%A2%D0%B5%D0%BC%D0%B0', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', 'test-token')
      },
    })

    cy.location('pathname', { timeout: 10000 }).should('eq', '/test-page')

    questions.forEach((q, index) => {
      answerQuestion(q, index)
      if (index < questions.length - 1) {
        cy.get(`#questions-panel .question[data-question-index="${index}"] #nextButton`).click({
          force: true,
        })
      }
    })

    cy.get('#finishButton', { timeout: 10000 }).click()
    cy.wait('@saveResult')
    cy.contains('h2', 'Итоги тестирования', { timeout: 20000 }).should('be.visible')
    cy.contains('.progress-container', 'Ваша оценка').should('be.visible')
    cy.contains('.progress-container', '10').should('be.visible')
  })
})
```

- [ ] **Step 2: Прогнать спек**

```bash
cd client-vue && npx cypress run --spec cypress/e2e/test-result.cy.js
```
Ожидаемо: 1 тест PASS. Если навигация по `#nextButton` внутри карточки не находит кнопку — проверить, что кнопка `#nextButton` внутри текущей `.question` (она там есть по разметке `TestQuestionCard`).

- [ ] **Step 3: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "test(e2e): test-result.cy.js (otvety -> itogi) mock"
```

---

## Task 5: Полный прогон e2e + финал

**Files:** (изменений кода нет — проверка)

- [ ] **Step 1: Поднять vite dev и прогнать все спеки**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2/client-vue" && npm run dev > /tmp/vite-e2e.log 2>&1 &
sleep 6 && npx cypress run
```
Ожидаемо: все 4 теста (auth 2 + test-flow 1 + test-result 1) — PASS.

- [ ] **Step 2: Остановить vite dev**

```powershell
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'vite' -and $_.Name -match 'node' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

- [ ] **Step 3: Проверить, что артефакты Cypress не попали в git и `src`-проверки зелёные**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git status --short && cd client-vue && npm run type-check && npm run lint && npm run build
```
Ожидаемо: рабочее дерево без `cypress/videos|screenshots`, type-check/lint/build без ошибок.

- [ ] **Step 4: Финальный коммит (если что-то осталось)**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && git commit -m "test(e2e): final Etapa 7" || echo "нечего коммитить"
```

---

## Definition of Done (Этап 7)

- [ ] Cypress настроен в `client-vue/` (config baseUrl 5173, support, скрипты, .gitignore, eslint ignore).
- [ ] `cypress run` зелёный: `auth` (2), `test-flow` (1), `test-result` (1) — все mock, без бэкенда.
- [ ] `type-check`, `lint`, `build` (по `src/`) — без ошибок.
- [ ] Real-backend спеки (test-images, test-result-15/-1-5-10/-all/-15-all) сознательно вне объёма (сверены вручную через Playwright на Этапах 4–6).
- [ ] Все коммиты локально в `feat/vue-rewrite`; `client/` и `server/` не тронуты; на GitHub не запушено.
```
