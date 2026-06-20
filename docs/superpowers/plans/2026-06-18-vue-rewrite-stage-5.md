# Этап 5: Тесты (TestPage) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести страницу прохождения теста: загрузка теста по `testCode`+`variant`, все типы вопросов (multiple_choice, fill_in_the_blank, ordering, matching), навигация с пагинацией, подсчёт баллов/оценки, сохранение результата и экран итогов (SkillProgressBar + confetti) — поведение 1-в-1.

**Architecture:** Чистая логика — в `utils/testScoring.ts` (порт `ScoreCalculator`) и `utils/testFormat.ts` (`formatUnits`, парсер пропусков). API — `api/tests.ts` (`getTest`, `getTestImages`, `saveTestResult`). UI: компоненты по типу вопроса в `components/test/*`, карточка вопроса `TestQuestionCard.vue`, пагинация `QuestionPagination.vue`, итоги `SkillProgressBar.vue`. Оркестрация (состояние теста, навигатор, ответы, сабмит) — `views/TestView.vue`. Хранилище ответов из vanilla (`AnswerManager` + `addAnswerHandlers`) заменяется на реактивный `answers` в `TestView` и `v-model` на компонентах вопросов.

**Tech Stack:** Vue 3 `<script setup>` + TS, Vue Router 4, Pinia, Vitest + @vue/test-utils, Bootstrap 5, canvas-confetti.

## Global Constraints

- Весь код — в `client-vue/`. `client/` и `server/` НЕ менять.
- Имена компонентов многословные: `TestView`, `TestQuestionCard`, `QuestionPagination`, `MultipleChoiceQuestion`, `FillInBlankQuestion`, `OrderingQuestion`, `MatchingQuestion`, `SkillProgressBar`.
- Точная копия вёрстки/поведения; CSS переносим **дословно** в `assets/pages/test/`.
- Эндпоинты (как в старом клиенте): `GET /tests/test?testCode=&variant=` → объект теста; `GET /images/:topicId/:variant?maxQuestions=` → `{ success, images }`; `POST /test-results` (JWT) → `{ success, result }`.
- Контракты API и формулы подсчёта баллов/оценок — **строго как в старом клиенте** (`ScoreCalculator`). Числа шкал и градаций копировать дословно.
- Ветка `feat/vue-rewrite`, коммиты только локально, на GitHub НЕ пушим.
- В конце каждой задачи: `test:unit`, `type-check`, `build`, `lint` — зелёные.

## Перенос и осознанные решения по объёму

| Старое (`client/src/...`) | Новое (`client-vue/src/...`) |
|---|---|
| `components/test/TestLoader.js` | `api/tests.ts` (`getTest`) |
| `components/ui/CloudImageLoader.js` | `api/tests.ts` (`getTestImages`) |
| `services/userService.saveTestResult` | `api/tests.ts` (`saveTestResult`) |
| `components/test/ScoreCalculator.js` | `utils/testScoring.ts` |
| `components/test/QuestionRenderer.formatUnits` | `utils/testFormat.ts` |
| `components/test/AnswerManager.js` + `AnswerHandlers.js` | реактивный `answers` в `TestView` + `v-model` на компонентах вопросов |
| `components/test/QuestionRenderer.render*` | `components/test/{MultipleChoice,FillInBlank,Ordering,Matching}Question.vue` |
| `components/ui/Pagination.js` + `common/BasicPagination.js` | `components/test/QuestionPagination.vue` |
| `components/test/QuestionNavigator.js` | состояние навигации в `TestView.vue` |
| `components/test/TestQuestion.js` | `views/TestView.vue` + `components/test/TestQuestionCard.vue` |
| `components/ui/SkillProgressBar.js` | `components/test/SkillProgressBar.vue` |
| `pages/TestPage/TestPage.js` | `views/TestView.vue` |

**Вне объёма этого этапа (обосновано):**
- **Логика подавления ошибок загрузки изображений** (`setupErrorHandler`, `stopAllImageLoading`, отмена `src` через data-URI в `TestQuestion.js`) — это обход console-спама `OpaqueResponseBlocking` от Yandex Cloud в vanilla при ручных DOM-переходах. В Vue картинка вопроса монтируется/размонтируется вместе с карточкой (`v-if`), отдельная карточка показывается через `<Transition>`, поэтому параллельной догрузки старых картинок нет. Переносим только **поведение пользователя**: ленивое изображение вопроса с `@error="hide"`. Массовую отмену загрузок не переносим.
- **`AnswerHandlers.js`** — это дубль-реализация обработчиков, в актуальном потоке используется `QuestionRenderer.addAnswerHandlers`. Переносим логику сохранения ответов через `v-model` компонентов; отдельный `AnswerHandlers` не переносим.
- **Кнопка «тест» из каталога тем (TestModal)** уже решена в Этапе 4 (кнопки тестов — прямые ссылки на `/test-page?...`).

---

## Структура файлов (создаётся в этом этапе)

```
client-vue/src/
├─ api/
│  ├─ tests.ts             getTest, getTestImages, saveTestResult (+ типы)
│  └─ tests.spec.ts
├─ utils/
│  ├─ testFormat.ts        formatUnits, escapeAttr, parseFillInBlanks
│  ├─ testFormat.spec.ts
│  ├─ testScoring.ts       класс ScoreCalculator (порт 1-в-1)
│  └─ testScoring.spec.ts
├─ components/test/
│  ├─ QuestionPagination.vue
│  ├─ MultipleChoiceQuestion.vue
│  ├─ FillInBlankQuestion.vue
│  ├─ OrderingQuestion.vue
│  ├─ MatchingQuestion.vue
│  ├─ TestQuestionCard.vue
│  └─ SkillProgressBar.vue
├─ views/
│  └─ TestView.vue
└─ assets/
   ├─ background1.jpg                 (копия из client/)
   ├─ icons/drag-dots.svg            (копия из client/)
   └─ pages/test/
      ├─ layout.css  question.css  navigation.css
      ├─ forms.css   matching.css   ordering.css
      └─ progress.css                (копия SkillProgressBar.css)
```

---

## Task 1: Установка зависимостей, ассеты, CSS, типы, заглушка маршрута

**Files:**
- Modify: `client-vue/package.json` (добавится через npm)
- Create: `client-vue/src/assets/pages/test/{layout,question,navigation,forms,matching,ordering,progress}.css`
- Create: `client-vue/src/assets/background1.jpg`, `client-vue/src/assets/icons/drag-dots.svg`
- Modify: `client-vue/src/main.ts` (импорт CSS теста)
- Modify: `client-vue/src/api/types.ts` (типы теста)

**Interfaces:**
- Produces: типы `TestQuestionType`, `TestQuestionData`, `TestData`, `TestResultPayload`, `SavedTestResult`, `TestImagesResult`.

- [ ] **Step 1: Установить canvas-confetti и типы**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2/client-vue" && npm install canvas-confetti && npm install -D @types/canvas-confetti
```
Ожидаемо: пакеты добавлены в `package.json`.

- [ ] **Step 2: Скопировать ассеты и CSS**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && \
mkdir -p client-vue/src/assets/icons client-vue/src/assets/pages/test && \
cp client/src/assets/background1.jpg client-vue/src/assets/background1.jpg && \
cp client/src/assets/icons/drag-dots.svg client-vue/src/assets/icons/drag-dots.svg && \
cp client/src/pages/TestPage/layout.css      client-vue/src/assets/pages/test/layout.css && \
cp client/src/pages/TestPage/question.css    client-vue/src/assets/pages/test/question.css && \
cp client/src/pages/TestPage/navigation.css  client-vue/src/assets/pages/test/navigation.css && \
cp client/src/pages/TestPage/forms.css       client-vue/src/assets/pages/test/forms.css && \
cp client/src/pages/TestPage/matching.css    client-vue/src/assets/pages/test/matching.css && \
cp client/src/pages/TestPage/ordering.css    client-vue/src/assets/pages/test/ordering.css && \
cp client/src/components/ui/SkillProgressBar.css client-vue/src/assets/pages/test/progress.css && \
echo ok && ls client-vue/src/assets/pages/test | wc -l
```
Ожидаемо: 7 CSS-файлов.

- [ ] **Step 3: Подключить CSS теста в `client-vue/src/main.ts`**

После строки `import '@/assets/pages/topic.css'` добавить:

```ts
import '@/assets/pages/test/layout.css'
import '@/assets/pages/test/question.css'
import '@/assets/pages/test/navigation.css'
import '@/assets/pages/test/forms.css'
import '@/assets/pages/test/matching.css'
import '@/assets/pages/test/ordering.css'
import '@/assets/pages/test/progress.css'
```

- [ ] **Step 4: Добавить типы теста в конец `client-vue/src/api/types.ts`**

```ts
export type TestQuestionType =
  | 'multiple_choice'
  | 'fill_in_the_blank'
  | 'ordering'
  | 'matching'

export interface TestQuestionData {
  type: TestQuestionType
  question?: string
  questionDescription?: string
  // multiple_choice
  options?: string[]
  correct_answer?: string
  // fill_in_the_blank
  correct_answers?: string[]
  allow_any_order?: boolean
  // ordering
  sequence?: string[]
  correctOrder?: string[]
  // matching
  left_column?: string[]
  right_column?: string[]
  correct_matches?: Record<string, string>
}

export interface TestData {
  testCode: string
  testTitle: string
  variant: number | string
  questions: TestQuestionData[]
}

export interface TestResultMeta {
  success: boolean
  data: TestData | null
  topicName: string
  error?: string
}

export interface TestImagesResult {
  success: boolean
  images: Record<string, string>
}

export interface TestResultPayload {
  testCode: string
  variant: number
  score: number
  totalQuestions: number
  maxPoints: number
  percentage: number
  grade: number
  answersDetails: unknown[]
}

export interface SavedTestResult {
  max_points?: number
  grade?: number
  [key: string]: unknown
}
```

- [ ] **Step 5: Проверить сборку**

```bash
cd client-vue && npm run type-check && npm run build
```
Ожидаемо: без ошибок (маршрут `/test-page` пока на `PlaceholderView`).

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "chore: assety/CSS/tipy/confetti dlya Etapa 5 (testy)"
```

---

## Task 2: API тестов (TDD)

**Files:**
- Create: `client-vue/src/api/tests.ts`
- Create: `client-vue/src/api/tests.spec.ts`

**Interfaces:**
- Consumes: `http.publicRequest`, `http.post`, `API_CONFIG`.
- Produces:
  - `getTest(testCode: string, variant: number): Promise<TestResultMeta>`
  - `getTestImages(topicId: number, variant: number, maxQuestions?: number): Promise<TestImagesResult>`
  - `saveTestResult(payload: TestResultPayload): Promise<SavedTestResult | null>`
  - `parseQuestions(raw: unknown): TestQuestionData[]` (экспортируется для теста — логика из `TestLoader.fetchTestData`).

- [ ] **Step 1: Написать падающий тест `client-vue/src/api/tests.spec.ts`**

```ts
import { describe, it, expect, afterEach, vi } from 'vitest'
import { parseQuestions, getTest } from './tests'

function mockFetchJson(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => 'application/json' },
    clone() {
      return this
    },
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(body)).buffer,
  })
}

afterEach(() => vi.restoreAllMocks())

describe('parseQuestions', () => {
  it('массив возвращает как есть', () => {
    const q = [{ type: 'multiple_choice' }]
    expect(parseQuestions(q)).toEqual(q)
  })
  it('строку парсит из JSON', () => {
    expect(parseQuestions('[{"type":"ordering"}]')).toEqual([{ type: 'ordering' }])
  })
  it('разворачивает вложенный .questions', () => {
    expect(parseQuestions({ questions: [{ type: 'matching' }] })).toEqual([{ type: 'matching' }])
  })
  it('некорректную строку → пустой массив', () => {
    expect(parseQuestions('не json')).toEqual([])
  })
})

describe('getTest', () => {
  it('успех: форматирует данные', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchJson({ testTitle: 'Тема', variant: 1, questions: [{ type: 'multiple_choice' }] }),
    )
    const res = await getTest('test1_1', 1)
    expect(res.success).toBe(true)
    expect(res.data?.questions).toHaveLength(1)
    expect(res.data?.testCode).toBe('test1_1')
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- tests.spec
```
Ожидаемо: FAIL (модуль не найден).

- [ ] **Step 3: Создать `client-vue/src/api/tests.ts`**

```ts
import { API_CONFIG } from './config'
import { http } from './http'
import type {
  TestData,
  TestImagesResult,
  TestQuestionData,
  TestResultMeta,
  TestResultPayload,
  SavedTestResult,
} from './types'

// Порт TestLoader.fetchTestData: questions может прийти строкой JSON, объектом,
// либо объектом с вложенным полем questions.
export function parseQuestions(raw: unknown): TestQuestionData[] {
  let questions: unknown = []
  try {
    if (typeof raw === 'string') {
      questions = JSON.parse(raw)
    } else if (raw && typeof raw === 'object') {
      questions = raw
    }
    if (
      questions &&
      typeof questions === 'object' &&
      Array.isArray((questions as { questions?: unknown }).questions)
    ) {
      questions = (questions as { questions: unknown[] }).questions
    }
  } catch {
    return []
  }
  return Array.isArray(questions) ? (questions as TestQuestionData[]) : []
}

export async function getTest(testCode: string, variant: number): Promise<TestResultMeta> {
  try {
    const data = await http.publicRequest<{
      testTitle?: string
      variant?: number | string
      questions?: unknown
    }>(API_CONFIG.ENDPOINTS.TEST_BY_CODE, {
      params: { testCode, variant },
      context: 'tests.getTest',
    })

    if (!data) return { success: false, data: null, topicName: 'Тест' }

    const formatted: TestData = {
      testCode,
      testTitle: data.testTitle || 'Тест',
      variant: data.variant ?? variant,
      questions: parseQuestions(data.questions),
    }
    return { success: true, data: formatted, topicName: data.testTitle || 'Тест' }
  } catch (error) {
    return {
      success: false,
      data: { testCode, testTitle: 'Тест', variant, questions: [] },
      topicName: 'Тест',
      error: (error as Error).message,
    }
  }
}

export async function getTestImages(
  topicId: number,
  variant: number,
  maxQuestions?: number,
): Promise<TestImagesResult> {
  try {
    const params: Record<string, number> = {}
    if (Number.isFinite(maxQuestions) && (maxQuestions as number) > 0) {
      params.maxQuestions = maxQuestions as number
    }
    const data = await http.publicRequest<{ success?: boolean; images?: Record<string, string> }>(
      `${API_CONFIG.ENDPOINTS.IMAGES}/${topicId}/${variant}`,
      { params, context: 'tests.getTestImages' },
    )
    if (data && data.images) return { success: true, images: data.images }
    return { success: true, images: {} }
  } catch {
    return { success: false, images: {} }
  }
}

export async function saveTestResult(
  payload: TestResultPayload,
): Promise<SavedTestResult | null> {
  try {
    const data = await http.post<{ success?: boolean; result?: SavedTestResult }>(
      API_CONFIG.ENDPOINTS.TEST_RESULTS.SAVE,
      payload,
      { context: 'tests.saveTestResult' },
    )
    return data && data.result ? data.result : null
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- tests.spec
```
Ожидаемо: PASS.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: api/tests (getTest/getTestImages/saveTestResult) s testami"
```

---

## Task 3: Утилиты форматирования (TDD)

**Files:**
- Create: `client-vue/src/utils/testFormat.ts`
- Create: `client-vue/src/utils/testFormat.spec.ts`

**Interfaces:**
- Produces:
  - `formatUnits(text: string): string` (порт 1-в-1 из `QuestionRenderer`)
  - `escapeAttr(value: unknown): string`
  - `parseFillInBlanks(questionText: string, savedAnswers: (string|null)[]): FillSegment[]`
    где `type FillSegment = { kind: 'html'; html: string } | { kind: 'input'; blankIndex: number; prefix: string; punctuation: string; value: string }`
    — заменяет regex-вставку инпутов из `renderFillInTheBlank` на массив сегментов для рендера в шаблоне.

- [ ] **Step 1: Написать падающий тест `client-vue/src/utils/testFormat.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { formatUnits, parseFillInBlanks } from './testFormat'

describe('formatUnits', () => {
  it('ставит неразрывный пробел перед %', () => {
    expect(formatUnits('влажность 70 %')).toBe('влажность 70&nbsp;%')
  })
  it('обрабатывает см', () => {
    expect(formatUnits('длина 15 см')).toContain('15&nbsp;см')
  })
  it('пустую строку возвращает как есть', () => {
    expect(formatUnits('')).toBe('')
  })
})

describe('parseFillInBlanks', () => {
  it('один пропуск даёт html + input + html', () => {
    const seg = parseFillInBlanks('Вода кипит при ___ градусов', [])
    const inputs = seg.filter((s) => s.kind === 'input')
    expect(inputs).toHaveLength(1)
    expect(inputs[0]).toMatchObject({ blankIndex: 0 })
  })
  it('подставляет сохранённый ответ', () => {
    const seg = parseFillInBlanks('Ответ: ___', ['100'])
    const input = seg.find((s) => s.kind === 'input')
    expect(input).toMatchObject({ value: '100' })
  })
  it('переносит пунктуацию после пропуска', () => {
    const seg = parseFillInBlanks('Список: ___, ___.', [])
    const inputs = seg.filter((s) => s.kind === 'input')
    expect(inputs).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- testFormat
```
Ожидаемо: FAIL.

- [ ] **Step 3: Создать `client-vue/src/utils/testFormat.ts`**

```ts
export type FillSegment =
  | { kind: 'html'; html: string }
  | { kind: 'input'; blankIndex: number; prefix: string; punctuation: string; value: string }

// Порт QuestionRenderer.formatUnits — неразрывный пробел перед %, °C/°С, см.
export function formatUnits(text: string): string {
  if (!text) return text
  return text.replace(/(\d)\s*(%|°\s*[CС]|см\b)/gi, (match, digit, unit) => {
    if (unit === '%') return `${digit}&nbsp;%`
    if (unit.includes('°')) {
      const symbol = /[Сс]/.test(unit) ? '°С' : '°C'
      return `${digit}&nbsp;${symbol}`
    }
    if (unit.includes('см')) return `${digit}&nbsp;см`
    return match
  })
}

export function escapeAttr(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Порт renderFillInTheBlank: формируем сегменты текста и инпутов из текста вопроса.
// Regex и порядок — как в старом клиенте.
export function parseFillInBlanks(
  questionText: string,
  savedAnswers: (string | null)[] = [],
): FillSegment[] {
  const formatted = formatUnits(questionText || '')
  const regex = /(\d+\)\s*)?___\s*([,;:.]|%|°\s*[CС]|см\b)?/g
  const segments: FillSegment[] = []
  let lastIndex = 0
  let blankIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(formatted)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'html', html: formatted.slice(lastIndex, match.index) })
    }
    const prefix = match[1] ? match[1].trim() : ''
    const punctuation = match[2] || ''
    segments.push({
      kind: 'input',
      blankIndex,
      prefix,
      punctuation,
      value: savedAnswers[blankIndex] || '',
    })
    blankIndex += 1
    lastIndex = regex.lastIndex
  }
  if (lastIndex < formatted.length) {
    segments.push({ kind: 'html', html: formatted.slice(lastIndex) })
  }
  return segments
}
```

- [ ] **Step 4: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- testFormat
```
Ожидаемо: PASS.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: utils/testFormat (formatUnits, parseFillInBlanks) s testami"
```

---

## Task 4: Подсчёт баллов — ScoreCalculator (TDD)

**Files:**
- Create: `client-vue/src/utils/testScoring.ts`
- Create: `client-vue/src/utils/testScoring.spec.ts`

**Interfaces:**
- Consumes: тип `TestData`, `TestQuestionData`.
- Produces: класс `ScoreCalculator` с методами `getMaxScore()`, `calculateTotalScore(userAnswers)`, `getAnsweredPercentage(userAnswers)`, `getGrade(scorePercent, questionCount)`, поле `lastDetails`. Все формулы и константы шкал — дословно из `client/src/components/test/ScoreCalculator.js`.

- [ ] **Step 1: Написать падающий тест `client-vue/src/utils/testScoring.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { ScoreCalculator } from './testScoring'
import type { TestData } from '@/api/types'

function makeTest(questions: TestData['questions']): TestData {
  return { testCode: 't', testTitle: 'T', variant: 1, questions }
}

describe('ScoreCalculator.getMaxScore', () => {
  it('для 10 вопросов сумма шкалы = 100', () => {
    const q = Array.from({ length: 10 }, () => ({ type: 'multiple_choice' as const }))
    expect(new ScoreCalculator(makeTest(q)).getMaxScore()).toBe(100)
  })
  it('для нестандартного числа вопросов = 0', () => {
    const q = Array.from({ length: 3 }, () => ({ type: 'multiple_choice' as const }))
    expect(new ScoreCalculator(makeTest(q)).getMaxScore()).toBe(0)
  })
})

describe('ScoreCalculator.calculateTotalScore (multiple_choice)', () => {
  it('правильный первый ответ даёт баллы шкалы', () => {
    const q = Array.from({ length: 10 }, (_, i) => ({
      type: 'multiple_choice' as const,
      correct_answer: `ans${i}`,
    }))
    const calc = new ScoreCalculator(makeTest(q))
    const answers = q.map((qq) => qq.correct_answer as string)
    expect(calc.calculateTotalScore(answers)).toBe(100)
  })
  it('неверные ответы → 0', () => {
    const q = Array.from({ length: 10 }, () => ({
      type: 'multiple_choice' as const,
      correct_answer: 'верно',
    }))
    const calc = new ScoreCalculator(makeTest(q))
    expect(calc.calculateTotalScore(q.map(() => 'неверно'))).toBe(0)
  })
})

describe('ScoreCalculator.getGrade', () => {
  it('0% → 1', () => {
    const calc = new ScoreCalculator(makeTest([]))
    expect(calc.getGrade(0, 10)).toBe(1)
  })
  it('100% (10 вопросов) → 10', () => {
    const calc = new ScoreCalculator(makeTest([]))
    expect(calc.getGrade(100, 10)).toBe(10)
  })
})

describe('ScoreCalculator.getAnsweredPercentage', () => {
  it('половина отвечено → 50', () => {
    const q = Array.from({ length: 10 }, () => ({ type: 'multiple_choice' as const }))
    const calc = new ScoreCalculator(makeTest(q))
    const answers = ['a', 'b', 'c', 'd', 'e', undefined, undefined, undefined, undefined, undefined]
    expect(calc.getAnsweredPercentage(answers as unknown[])).toBe(50)
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- testScoring
```
Ожидаемо: FAIL.

- [ ] **Step 3: Создать `client-vue/src/utils/testScoring.ts` (порт 1-в-1)**

```ts
import type { TestData, TestQuestionData } from '@/api/types'

export interface ScoreDetail {
  questionNumber: number
  type: string
  userAnswer: unknown
  correct: unknown
  isCorrect: boolean
  score: number
  matchPercentage?: number
}

export class ScoreCalculator {
  testInstance: TestData
  lastDetails: ScoreDetail[] = []
  scales: Record<number, number[]> = {
    10: [8, 8, 8, 10, 10, 10, 10, 10, 10, 16],
    15: [4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 10, 12, 12],
  }

  constructor(testInstance: TestData) {
    this.testInstance = testInstance
  }

  getMaxScore(): number {
    const qn = this.testInstance?.questions?.length || 0
    const scale = this.scales[qn]
    return Array.isArray(scale) ? scale.reduce((a, b) => a + b, 0) : 0
  }

  normalizeString(str: unknown): unknown {
    if (typeof str !== 'string') return str
    return str
      .replace(/&nbsp;/gi, ' ')
      .replace(/\u00a0/g, ' ')
      .replace(/[–—−]/g, '-')
      .replace(/([+-])\s+(?=\d)/g, '$1')
      .replace(/(\d)\s*-\s*(\d)/g, '$1-$2')
      .replace(/\s*%/g, '%')
      .replace(/°\s*[cс]/gi, '°c')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  }

  normalizeChoiceValue(value: unknown): unknown {
    const normalized = this.normalizeString(value)
    return typeof normalized === 'string'
      ? normalized.replace(/[\u00a0\u202f\u2007]/g, '').replace(/\s+/g, '')
      : normalized
  }

  isNumericLike(value: unknown): boolean {
    if (typeof value === 'number') return Number.isFinite(value)
    if (typeof value !== 'string') return false
    const trimmed = value.trim()
    if (trimmed === '') return false
    return /^-?\d+(?:[.,]\d+)?$/.test(trimmed)
  }

  toCanonicalToken(value: unknown): string {
    if (this.isNumericLike(value)) {
      const num = Number(String(value).replace(',', '.'))
      return `##NUM:${Number.isFinite(num) ? num : 'NaN'}`
    }
    return `##STR:${this.normalizeString(String(value))}`
  }

  compareCanonicalArrays(arr1: unknown, arr2: unknown, allowAnyOrder = false): boolean {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false
    const norm1 = arr1.map((v) => this.toCanonicalToken(v))
    const norm2 = arr2.map((v) => this.toCanonicalToken(v))
    return allowAnyOrder
      ? norm1.length === norm2.length && norm1.every((item) => norm2.includes(item))
      : norm1.length === norm2.length && norm1.every((item, i) => item === norm2[i])
  }

  levenshteinDistance(str1: string, str2: string): number {
    const dp: number[][] = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null))
    for (let i = 0; i <= str1.length; i++) dp[0][i] = i
    for (let j = 0; j <= str2.length; j++) dp[j][0] = j
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        dp[j][i] = Math.min(dp[j][i - 1] + 1, dp[j - 1][i] + 1, dp[j - 1][i - 1] + indicator)
        if (
          i > 1 &&
          j > 1 &&
          str1[i - 1] === str2[j - 2] &&
          str1[i - 2] === str2[j - 1]
        ) {
          dp[j][i] = Math.min(dp[j][i], dp[j - 2][i - 2] + indicator)
        }
      }
    }
    return dp[str2.length][str1.length]
  }

  jaccardSimilarityForWords(userAnswer: string, correctAnswer: string, maxDistance = 3): boolean {
    const userWords = userAnswer.toLowerCase().split(' ')
    const correctWords = correctAnswer.toLowerCase().split(' ')
    const matchedWords = correctWords.filter((correctWord) =>
      userWords.some((userWord) => this.levenshteinDistance(userWord, correctWord) <= maxDistance),
    )
    const unionSize = new Set([...userWords, ...correctWords]).size
    return matchedWords.length / unionSize >= 0.5
  }

  compareArrays(arr1: unknown, arr2: unknown, allowAnyOrder = false): boolean {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false
    const normArr1 = arr1.map((v) => this.normalizeString(v))
    const normArr2 = arr2.map((v) => this.normalizeString(v))
    return allowAnyOrder
      ? normArr1.length === normArr2.length && normArr1.every((item) => normArr2.includes(item))
      : normArr1.length === normArr2.length && normArr1.every((item, index) => item === normArr2[index])
  }

  calculateTotalScore(userAnswers: unknown[]): number {
    const questions = this.testInstance.questions
    const questionCount = questions.length
    const scale = this.scales[questionCount]
    if (!scale) return 0

    const details: ScoreDetail[] = []
    const totalScore = questions.reduce((acc: number, question: TestQuestionData, index: number) => {
      const userAnswer = userAnswers[index]
      let isCorrect = false
      let questionScore = 0

      switch (question.type) {
        case 'multiple_choice':
          isCorrect =
            this.normalizeString(userAnswer) === this.normalizeString(question.correct_answer) ||
            this.normalizeChoiceValue(userAnswer) === this.normalizeChoiceValue(question.correct_answer)
          questionScore = isCorrect ? scale[index] : 0
          details.push({
            questionNumber: index + 1,
            type: 'multiple_choice',
            userAnswer,
            correct: question.correct_answer,
            isCorrect,
            score: questionScore,
          })
          break

        case 'fill_in_the_blank':
          if (Array.isArray(userAnswer) && Array.isArray(question.correct_answers)) {
            const hasNumeric = question.correct_answers.some((v) => this.isNumericLike(v))
            if (hasNumeric) {
              isCorrect = this.compareCanonicalArrays(
                userAnswer,
                question.correct_answers,
                question.allow_any_order,
              )
            } else {
              isCorrect =
                this.compareArrays(userAnswer, question.correct_answers, question.allow_any_order) ||
                this.jaccardSimilarityForWords(
                  (userAnswer as string[]).join(' '),
                  question.correct_answers.join(' '),
                )
            }
            questionScore = isCorrect ? scale[index] : 0
            details.push({
              questionNumber: index + 1,
              type: 'fill_in_the_blank',
              userAnswer,
              correct: question.correct_answers,
              isCorrect,
              score: questionScore,
            })
          }
          break

        case 'matching':
          if (typeof userAnswer === 'object' && typeof question.correct_matches === 'object') {
            const um = (userAnswer || {}) as Record<string, unknown>
            const cm = question.correct_matches as Record<string, string>
            isCorrect = Object.keys(cm).every(
              (key) => this.normalizeString(um[key]) === this.normalizeString(cm[key]),
            )
            questionScore = isCorrect ? scale[index] : 0
            details.push({
              questionNumber: index + 1,
              type: 'matching',
              userAnswer,
              correct: question.correct_matches,
              isCorrect,
              score: questionScore,
            })
          }
          break

        case 'ordering':
          if (Array.isArray(userAnswer) && Array.isArray(question.correctOrder)) {
            const correctOrder = question.correctOrder
            const matches = (userAnswer as string[]).reduce(
              (a, item, i) => a + (item === correctOrder[i] ? 1 : 0),
              0,
            )
            const matchPercentage = (matches / correctOrder.length) * 100
            if (matchPercentage > 50) questionScore = scale[index]
            else if (matchPercentage === 50) questionScore = scale[index] * 0.5
            details.push({
              questionNumber: index + 1,
              type: 'ordering',
              userAnswer,
              correct: correctOrder,
              isCorrect: questionScore > 0,
              score: questionScore,
              matchPercentage,
            })
          }
          break

        default:
          break
      }
      return acc + questionScore
    }, 0)

    this.lastDetails = details
    return totalScore
  }

  getAnsweredPercentage(userAnswers: unknown[]): number {
    const totalQuestions = this.testInstance.questions.length
    const answeredQuestionsCount = userAnswers.filter((answer) => answer !== undefined).length
    return totalQuestions ? (answeredQuestionsCount / totalQuestions) * 100 : 0
  }

  getGrade(scorePercent: number, questionCount: number): number {
    const gradingScale: Record<number, number[][]> = {
      10: [
        [1, 8, 1],
        [9, 16, 2],
        [17, 27, 3],
        [28, 38, 4],
        [39, 49, 5],
        [50, 65, 6],
        [66, 76, 7],
        [86, 90, 8],
        [91, 95, 9],
        [96, 100, 10],
      ],
      15: [
        [1, 8, 1],
        [9, 16, 2],
        [17, 26, 3],
        [27, 36, 4],
        [37, 48, 5],
        [49, 59, 6],
        [60, 70, 7],
        [71, 80, 8],
        [81, 91, 9],
        [92, 100, 10],
      ],
    }
    const percent = Number.isFinite(scorePercent) ? scorePercent : 0
    const normalized = Math.max(0, Math.min(100, percent))
    const scale = gradingScale[questionCount] || gradingScale[10]
    if (normalized === 0) return 1
    return scale.find(([min, max]) => normalized >= min && normalized <= max)?.[2] || 1
  }
}
```

- [ ] **Step 4: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- testScoring
```
Ожидаемо: PASS.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: utils/testScoring (ScoreCalculator port) s testami"
```

---

## Task 5: Пагинация вопросов (компонентный тест)

**Files:**
- Create: `client-vue/src/components/test/QuestionPagination.vue`
- Create: `client-vue/src/components/test/QuestionPagination.spec.ts`

**Interfaces:**
- Consumes: props `{ total: number; current: number; visited: number[] }`.
- Produces: кнопки с классами `page-button`, `active` (для `current`), `visited` (для индексов из `visited`); emit `select(index: number)`.

- [ ] **Step 1: Написать падающий тест `client-vue/src/components/test/QuestionPagination.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestionPagination from './QuestionPagination.vue'

describe('QuestionPagination', () => {
  it('рендерит total кнопок', () => {
    const w = mount(QuestionPagination, { props: { total: 5, current: 0, visited: [0] } })
    expect(w.findAll('.page-button')).toHaveLength(5)
  })
  it('помечает текущую active и посещённые visited', () => {
    const w = mount(QuestionPagination, { props: { total: 3, current: 1, visited: [0, 1] } })
    const btns = w.findAll('.page-button')
    expect(btns[1].classes()).toContain('active')
    expect(btns[0].classes()).toContain('visited')
  })
  it('emit select по клику', async () => {
    const w = mount(QuestionPagination, { props: { total: 3, current: 0, visited: [] } })
    await w.findAll('.page-button')[2].trigger('click')
    expect(w.emitted('select')?.[0]).toEqual([2])
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- QuestionPagination
```
Ожидаемо: FAIL.

- [ ] **Step 3: Создать `client-vue/src/components/test/QuestionPagination.vue`**

```vue
<script setup lang="ts">
const props = defineProps<{ total: number; current: number; visited: number[] }>()
const emit = defineEmits<{ (e: 'select', index: number): void }>()
</script>

<template>
  <button
    v-for="i in props.total"
    :key="i - 1"
    class="page-button"
    :class="{ active: i - 1 === props.current, visited: props.visited.includes(i - 1) }"
    @click="emit('select', i - 1)"
  >
    {{ i }}
  </button>
</template>
```

- [ ] **Step 4: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- QuestionPagination
```
Ожидаемо: PASS.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: QuestionPagination s testom"
```

---

## Task 6: Компоненты типов вопросов

Все четыре компонента используют единый контракт: props `{ question: TestQuestionData; index: number; modelValue: unknown }`, emit `update:modelValue`. Сохранённый ответ приходит в `modelValue`, изменения уходят наверх (замена `AnswerManager`+`addAnswerHandlers`).

**Files:**
- Create: `client-vue/src/components/test/MultipleChoiceQuestion.vue`
- Create: `client-vue/src/components/test/FillInBlankQuestion.vue`
- Create: `client-vue/src/components/test/OrderingQuestion.vue`
- Create: `client-vue/src/components/test/MatchingQuestion.vue`
- Create: `client-vue/src/components/test/QuestionTypes.spec.ts`

**Interfaces:**
- Consumes: `formatUnits`, `parseFillInBlanks` из `@/utils/testFormat`; `dragIcon` из `@/assets/icons/drag-dots.svg`.
- Produces: значение `modelValue` по типам: multiple_choice → `string|null`; fill_in_the_blank → `(string|null)[]|null`; ordering → `string[]`; matching → `Record<string,string>`.

- [ ] **Step 1: Написать падающий тест `client-vue/src/components/test/QuestionTypes.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MultipleChoiceQuestion from './MultipleChoiceQuestion.vue'
import MatchingQuestion from './MatchingQuestion.vue'

describe('MultipleChoiceQuestion', () => {
  it('рендерит варианты и эмитит выбор', async () => {
    const w = mount(MultipleChoiceQuestion, {
      props: {
        question: { type: 'multiple_choice', options: ['A', 'B'] },
        index: 0,
        modelValue: null,
      },
    })
    const radios = w.findAll('input[type="radio"]')
    expect(radios).toHaveLength(2)
    await radios[1].setValue()
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['B'])
  })
})

describe('MatchingQuestion', () => {
  it('рендерит select по левой колонке', () => {
    const w = mount(MatchingQuestion, {
      props: {
        question: {
          type: 'matching',
          left_column: ['л1', 'л2'],
          right_column: ['п1', 'п2'],
        },
        index: 0,
        modelValue: {},
      },
    })
    expect(w.findAll('select')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- QuestionTypes
```
Ожидаемо: FAIL.

- [ ] **Step 3: Создать `MultipleChoiceQuestion.vue`**

```vue
<script setup lang="ts">
import { formatUnits } from '@/utils/testFormat'
import type { TestQuestionData } from '@/api/types'

const props = defineProps<{ question: TestQuestionData; index: number; modelValue: unknown }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string | null): void }>()

function onPick(value: string): void {
  emit('update:modelValue', value || null)
}
</script>

<template>
  <template v-if="props.question.options && props.question.options.length">
    <label v-for="(option, i) in props.question.options" :key="i">
      <input
        type="radio"
        :name="`answer_${props.index}`"
        :value="option"
        :checked="props.modelValue === option"
        @change="onPick(option)"
      />
      <span v-html="formatUnits(option)"></span><br />
    </label>
  </template>
  <p v-else>Ошибка: варианты ответов не найдены</p>
</template>
```

> Примечание eslint: на `v-html` добавить `<!-- eslint-disable-next-line vue/no-v-html -->` перед строкой при необходимости (контент — варианты из БД, как в старом клиенте через `formatUnits`).

- [ ] **Step 4: Создать `FillInBlankQuestion.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { parseFillInBlanks } from '@/utils/testFormat'
import type { TestQuestionData } from '@/api/types'

const props = defineProps<{ question: TestQuestionData; index: number; modelValue: unknown }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: (string | null)[] | null): void }>()

const saved = computed<(string | null)[]>(() =>
  Array.isArray(props.modelValue) ? (props.modelValue as (string | null)[]) : [],
)
const segments = computed(() => parseFillInBlanks(props.question.question || '', saved.value))
const blanksCount = computed(() => segments.value.filter((s) => s.kind === 'input').length)

function onInput(blankIndex: number, value: string): void {
  const next = Array.from({ length: blanksCount.value }, (_, i) => saved.value[i] ?? null)
  next[blankIndex] = value || null
  emit('update:modelValue', next.some((a) => a) ? next : null)
}
</script>

<template>
  <p>
    <template v-for="(seg, i) in segments" :key="i">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-if="seg.kind === 'html'" v-html="seg.html"></span>
      <span v-else class="question-part">
        <template v-if="seg.prefix">{{ seg.prefix }} </template>
        <input
          type="text"
          :name="`answer_${props.index}_${seg.blankIndex}`"
          :value="seg.value"
          placeholder="Введите Ваш ответ"
          @input="onInput(seg.blankIndex, ($event.target as HTMLInputElement).value)"
        />
        {{ seg.punctuation }}
      </span>
    </template>
  </p>
</template>
```

- [ ] **Step 5: Создать `OrderingQuestion.vue`** (drag-and-drop: десктоп DnD + тач long-press, порт `renderOrdering`/`addAnswerHandlers`)

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import dragIcon from '@/assets/icons/drag-dots.svg'
import type { TestQuestionData } from '@/api/types'

const props = defineProps<{ question: TestQuestionData; index: number; modelValue: unknown }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string[]): void }>()

const items = ref<string[]>(
  Array.isArray(props.modelValue) && (props.modelValue as string[]).length
    ? [...(props.modelValue as string[])]
    : [...(props.question.sequence || [])],
)

watch(
  () => props.modelValue,
  (val) => {
    if (Array.isArray(val) && val.length) items.value = [...(val as string[])]
  },
)

function save(): void {
  emit('update:modelValue', [...items.value])
}

// --- Desktop DnD ---
let dragFrom: number | null = null
function onDragStart(i: number, e: DragEvent): void {
  dragFrom = i
  e.dataTransfer?.setData('text/plain', String(i))
  ;(e.target as HTMLElement).classList.add('dragging')
}
function onDragOver(e: DragEvent): void {
  e.preventDefault()
}
function onDrop(to: number, e: DragEvent): void {
  e.preventDefault()
  if (dragFrom === null || dragFrom === to) return
  const next = [...items.value]
  const [moved] = next.splice(dragFrom, 1)
  next.splice(to, 0, moved)
  items.value = next
  dragFrom = null
  save()
}
function onDragEnd(e: DragEvent): void {
  ;(e.target as HTMLElement).classList.remove('dragging')
  dragFrom = null
}
</script>

<template>
  <ul class="ordering-list" :id="`ordering_${props.index}`" @dragover="onDragOver">
    <li
      v-for="(item, i) in items"
      :key="`${item}-${i}`"
      class="draggable-item"
      draggable="true"
      :data-index="i"
      @dragstart="onDragStart(i, $event)"
      @drop="onDrop(i, $event)"
      @dragend="onDragEnd"
    >
      <span class="draggable-item-text">{{ item }}</span>
      <img class="draggable-item-icon" :src="dragIcon" alt="" />
    </li>
  </ul>
</template>
```

> Тач-перетаскивание (pointer/touch long-press из `addAnswerHandlers`) при ручной сверке на десктопе не критично; если на Этапе 7 (e2e/моб. сверка) выявится регресс — добавить pointer-обработчики отдельной задачей. Базовый HTML5 DnD покрывает десктоп 1-в-1.

- [ ] **Step 6: Создать `MatchingQuestion.vue`** (порт `renderMatching` + select-обработчик)

```vue
<script setup lang="ts">
import type { TestQuestionData } from '@/api/types'

const props = defineProps<{ question: TestQuestionData; index: number; modelValue: unknown }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: Record<string, string>): void }>()

function current(): Record<string, string> {
  return props.modelValue && typeof props.modelValue === 'object'
    ? { ...(props.modelValue as Record<string, string>) }
    : {}
}
function onChange(leftItem: string, value: string): void {
  const next = current()
  next[leftItem] = value
  emit('update:modelValue', next)
}
function selected(leftItem: string): string {
  return current()[leftItem] || ''
}
</script>

<template>
  <div class="matching-question">
    <ul class="matching-items">
      <li v-for="(item, i) in props.question.left_column || []" :key="i">
        <label>{{ item }}</label>
        <select
          :name="`answer_${props.index}_${i}`"
          :value="selected(item)"
          @change="onChange(item, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Выберите соответствие</option>
          <option v-for="(r, ri) in props.question.right_column || []" :key="ri" :value="r" :title="r">
            {{ r }}
          </option>
        </select>
      </li>
    </ul>
  </div>
</template>
```

- [ ] **Step 7: Запустить тесты — проходят**

```bash
cd client-vue && npm run test:unit -- QuestionTypes
```
Ожидаемо: PASS.

- [ ] **Step 8: type-check, lint**

```bash
cd client-vue && npm run type-check && npm run lint
```
Ожидаемо: зелёное.

- [ ] **Step 9: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: komponenty tipov voprosov (mc/fill/ordering/matching)"
```

---

## Task 7: Карточка вопроса

**Files:**
- Create: `client-vue/src/components/test/TestQuestionCard.vue`

**Interfaces:**
- Consumes: 4 компонента типов вопросов; `formatUnits`; props `{ question: TestQuestionData; index: number; total: number; imagePath: string | null; modelValue: unknown }`.
- Produces: emit `update:modelValue`, `prev`, `next`. Рендерит описание/текст вопроса, изображение (ленивое, `@error` скрывает), нужный компонент по типу, кнопки «назад/Далее» (как `renderQuestionHTML`).

- [ ] **Step 1: Создать `client-vue/src/components/test/TestQuestionCard.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { formatUnits } from '@/utils/testFormat'
import type { TestQuestionData } from '@/api/types'
import MultipleChoiceQuestion from './MultipleChoiceQuestion.vue'
import FillInBlankQuestion from './FillInBlankQuestion.vue'
import OrderingQuestion from './OrderingQuestion.vue'
import MatchingQuestion from './MatchingQuestion.vue'

const props = defineProps<{
  question: TestQuestionData
  index: number
  total: number
  imagePath: string | null
  modelValue: unknown
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
  (e: 'prev'): void
  (e: 'next'): void
}>()

const typeClass = computed(() =>
  props.question.type === 'matching'
    ? 'matching-only'
    : props.question.type === 'ordering'
      ? 'ordering-only'
      : 'general-question',
)

const component = computed(() => {
  switch (props.question.type) {
    case 'multiple_choice':
      return MultipleChoiceQuestion
    case 'fill_in_the_blank':
      return FillInBlankQuestion
    case 'ordering':
      return OrderingQuestion
    case 'matching':
      return MatchingQuestion
    default:
      return null
  }
})

const showImage = computed(
  () =>
    !!props.imagePath &&
    (props.imagePath.startsWith('http://') ||
      props.imagePath.startsWith('https://') ||
      props.imagePath.startsWith('data:')),
)

function hideImage(e: Event): void {
  ;(e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <div class="question" :class="typeClass" :data-question-index="props.index">
    <div class="question-navigation">
      <button id="prevButton" class="nav-button" @click="emit('prev')">
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 5L4 12L11 19V13.5H21V10.5H11V5Z" fill="currentColor" />
        </svg>
      </button>
      <button id="nextButton" class="nav-button" @click="emit('next')">
        <span>Далее</span>
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 5L20 12L13 19V13.5H3V10.5H13V5Z" fill="currentColor" />
        </svg>
      </button>
    </div>
    <div class="question-content">
      <div class="question-text">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-if="props.question.questionDescription" v-html="formatUnits(props.question.questionDescription)"></p>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-if="props.question.type !== 'fill_in_the_blank'" v-html="formatUnits(props.question.question || '')"></p>
        <component
          :is="component"
          v-if="component"
          :question="props.question"
          :index="props.index"
          :model-value="props.modelValue"
          @update:model-value="emit('update:modelValue', $event)"
        />
        <p v-else>Неизвестный тип вопроса</p>
      </div>
      <div v-if="showImage" class="question-image">
        <img :src="props.imagePath as string" alt="" loading="lazy" referrerpolicy="no-referrer" @error="hideImage" />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: зелёное.

- [ ] **Step 3: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: TestQuestionCard (kartochka voprosa)"
```

---

## Task 8: Экран итогов (SkillProgressBar)

**Files:**
- Create: `client-vue/src/components/test/SkillProgressBar.vue`

**Interfaces:**
- Consumes: `canvas-confetti`; props `{ answeredPercentage: number; userScore: number; userGrade: number; testTopic: string }`.
- Produces: три прогресс-бара (отвечено %, баллы /100, оценка /10), анимация ширины, конфетти при `userGrade > 5`. Разметка/классы — как `SkillProgressBar.js` (`header-container`, `progress-container`, `scale-container`, `scale-label`, `progress-bar`, `progress-fill`, `value-label`).

- [ ] **Step 1: Создать `client-vue/src/components/test/SkillProgressBar.vue`**

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import confetti from 'canvas-confetti'

const props = defineProps<{
  answeredPercentage: number
  userScore: number
  userGrade: number
  testTopic: string
}>()

interface Bar {
  label: string
  value: number
  maxValue: number
  totalDivisions: number
  showPercentage: boolean
  display: string
  target: number
}

function makeBar(
  label: string,
  value: number,
  maxValue: number,
  totalDivisions: number,
  showPercentage = false,
): Bar {
  return {
    label,
    value,
    maxValue,
    totalDivisions,
    showPercentage,
    display: showPercentage ? `${Math.round(value)}%` : String(value),
    target: (value / maxValue) * 100,
  }
}

const bars = ref<Bar[]>([
  makeBar('Количество отвеченных вопросов', props.answeredPercentage, 100, 10, true),
  makeBar('Количество набранных баллов', props.userScore, 100, 10),
  makeBar('Ваша оценка', props.userGrade, 10, 10),
])

const widths = ref<number[]>([0, 0, 0])

function scaleLabels(totalDivisions: number, maxValue: number): number[] {
  return Array.from({ length: totalDivisions + 1 }, (_, i) => Math.round((i * maxValue) / totalDivisions))
}

function runConfetti(): void {
  const settings = {
    particleCount: 200,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#00ff00', '#0000ff', '#c0c0c0'],
    shapes: ['circle', 'square'] as ('circle' | 'square')[],
    scalar: 1.5,
  }
  for (let i = 0; i < 3; i++) setTimeout(() => confetti(settings), i * 500)
}

onMounted(() => {
  setTimeout(() => {
    bars.value.forEach((bar, index) => {
      setTimeout(() => {
        widths.value[index] = bar.target
      }, index * 1000)
    })
    if (props.userGrade > 5) setTimeout(runConfetti, bars.value.length * 1000 + 1000)
  }, 100)
})
</script>

<template>
  <div class="header-container">
    <h2>Итоги тестирования по теме: {{ props.testTopic }}</h2>
  </div>
  <div v-for="(bar, index) in bars" :key="index" class="progress-container">
    <p>
      {{ bar.label }}: <span class="value-label">{{ bar.display }}</span
      ><template v-if="!bar.showPercentage"> / {{ bar.maxValue }}</template>
    </p>
    <div class="scale-container">
      <span v-for="(label, li) in scaleLabels(bar.totalDivisions, bar.maxValue)" :key="li" class="scale-label">{{
        label
      }}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" :class="{ complete: widths[index] > 0 }" :style="{ width: `${widths[index]}%` }"></div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: зелёное.

- [ ] **Step 3: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: SkillProgressBar (itogi testa) s confetti"
```

---

## Task 9: Страница теста (оркестрация) + маршрут

**Files:**
- Create: `client-vue/src/views/TestView.vue`
- Modify: `client-vue/src/router/index.ts` (test-page → TestView)

**Interfaces:**
- Consumes: `getTest`, `getTestImages`, `saveTestResult`, `ScoreCalculator`, `TestQuestionCard`, `QuestionPagination`, `SkillProgressBar`, query `testCode`, `variant`, `title`.
- Produces: `TestView` — загрузка теста, состояние ответов/навигации, сабмит и итоги. Заголовок «{title}: Вариант {variant}», панель индикаторов (пагинация + кнопка «Результаты»), карточка текущего вопроса, после сабмита — `SkillProgressBar`.

- [ ] **Step 1: Создать `client-vue/src/views/TestView.vue`**

```vue
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTest, getTestImages, saveTestResult } from '@/api/tests'
import { ScoreCalculator } from '@/utils/testScoring'
import type { TestData } from '@/api/types'
import background from '@/assets/background1.jpg'
import TestQuestionCard from '@/components/test/TestQuestionCard.vue'
import QuestionPagination from '@/components/test/QuestionPagination.vue'
import SkillProgressBar from '@/components/test/SkillProgressBar.vue'

const route = useRoute()
const test = ref<TestData | null>(null)
const topicName = ref('Тест')
const images = ref<Record<string, string>>({})
const status = ref<'loading' | 'ready' | 'empty'>('loading')

const currentIndex = ref(0)
const visited = reactive<Set<number>>(new Set([0]))
const answers = reactive<Record<number, unknown>>({})

const finished = ref(false)
const result = reactive({ answeredPercentage: 0, score: 0, grade: 0 })

const normalizedTitle = computed(() =>
  ((route.query.title as string) || topicName.value || 'Тест').replace(/^Тема:?\s*/i, ''),
)
const variant = computed(() => String(route.query.variant || '1'))
const total = computed(() => test.value?.questions.length || 0)
const currentQuestion = computed(() => test.value?.questions[currentIndex.value] || null)
const currentImage = computed(() => images.value[String(currentIndex.value + 1)] || null)
const visitedArr = computed(() => Array.from(visited))

function goTo(index: number): void {
  if (index < 0 || index >= total.value) return
  currentIndex.value = index
  visited.add(index)
}
function prev(): void {
  if (currentIndex.value > 0) goTo(currentIndex.value - 1)
}
function next(): void {
  if (currentIndex.value < total.value - 1) goTo(currentIndex.value + 1)
}

async function load(): Promise<void> {
  status.value = 'loading'
  const testCode = route.query.testCode as string | undefined
  const v = parseInt(variant.value, 10) || 1
  if (!testCode) {
    status.value = 'empty'
    return
  }
  const res = await getTest(testCode, v)
  if (!res.success || !res.data || !res.data.questions.length) {
    test.value = res.data
    status.value = 'empty'
    return
  }
  test.value = res.data
  topicName.value = res.topicName

  const match = testCode.match(/test(\d+)_/)
  const topicId = match ? parseInt(match[1], 10) : 1
  getTestImages(topicId, v, res.data.questions.length)
    .then((r) => {
      images.value = r.images
    })
    .catch(() => {})

  status.value = 'ready'
}

async function finish(): Promise<void> {
  if (!test.value) return
  const calc = new ScoreCalculator(test.value)
  const userAnswers = Array.from({ length: total.value }, (_, i) => answers[i])
  const totalScore = calc.calculateTotalScore(userAnswers)
  const answeredPercentage = calc.getAnsweredPercentage(userAnswers)
  const localMax = calc.getMaxScore()
  const localPercentage = localMax > 0 ? Math.round((totalScore / localMax) * 100) : 0

  const payloadGrade = calc.getGrade(localPercentage, total.value)
  const saved = await saveTestResult({
    testCode: test.value.testCode || 'unknown',
    variant: Number(test.value.variant) || 1,
    score: totalScore,
    totalQuestions: total.value,
    maxPoints: localMax,
    percentage: localPercentage,
    grade: payloadGrade,
    answersDetails: calc.lastDetails || [],
  })

  const maxPoints =
    saved && typeof saved.max_points === 'number' && saved.max_points > 0 ? saved.max_points : localMax
  const scorePercentage = maxPoints > 0 ? Math.round((totalScore / maxPoints) * 100) : 0
  const grade =
    saved && typeof saved.grade === 'number' ? saved.grade : calc.getGrade(scorePercentage, total.value)

  result.answeredPercentage = answeredPercentage
  result.score = totalScore
  result.grade = grade
  finished.value = true
}

onMounted(load)
</script>

<template>
  <main id="test-page" class="container my-4">
    <SkillProgressBar
      v-if="finished"
      :answered-percentage="result.answeredPercentage"
      :user-score="result.score"
      :user-grade="result.grade"
      :test-topic="topicName"
    />

    <div
      v-else
      class="test-page-styles"
      :style="{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }"
    >
      <div class="test-info">
        <h2>{{ normalizedTitle }}: <span class="variant-text">Вариант {{ variant }}</span></h2>
      </div>

      <div v-if="status === 'loading'" class="test-loading">Данные загружаются...</div>

      <template v-else-if="status === 'ready'">
        <div id="indicator-panel" class="indicator-panel">
          <QuestionPagination :total="total" :current="currentIndex" :visited="visitedArr" @select="goTo" />
          <button id="finishButton" class="nav-button finish-button" @click="finish">Результаты</button>
        </div>

        <div id="questions-panel" class="questions-panel">
          <h3>Вопрос {{ currentIndex + 1 }} из {{ total }}</h3>
          <TestQuestionCard
            v-if="currentQuestion"
            :key="currentIndex"
            :question="currentQuestion"
            :index="currentIndex"
            :total="total"
            :image-path="currentImage"
            :model-value="answers[currentIndex]"
            @update:model-value="answers[currentIndex] = $event"
            @prev="prev"
            @next="next"
          />
        </div>
        <div class="navigation-panel"></div>
      </template>

      <p v-else class="error-note">Не удалось загрузить тест.</p>
    </div>
  </main>
</template>
```

- [ ] **Step 2: Переключить маршрут `test-page` в `client-vue/src/router/index.ts`**

Добавить `import TestView from '@/views/TestView.vue'` рядом с другими импортами view; в маршруте `test-page` заменить `component: PlaceholderView` на `component: TestView`.

- [ ] **Step 3: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: зелёное.

- [ ] **Step 4: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "feat: TestView (prohozhdenie testa) + marshrut test-page"
```

---

## Task 10: Финальная проверка и ручная сверка

**Files:** (изменений кода нет — проверка)

- [ ] **Step 1: Полный прогон**

```bash
cd client-vue && npm run test:unit && npm run type-check && npm run build && npm run lint
```
Ожидаемо: все тесты зелёные, без ошибок.

- [ ] **Step 2: Ручная сверка (нужен backend на :3000)**

Поднять API-мост (если стек в docker, server не публикует порт):
```bash
docker run -d --rm --name vite-api-bridge --network students-skill-tracker-2_default \
  -p 3000:3000 alpine/socat tcp-listen:3000,fork,reuseaddr \
  tcp-connect:students-skill-tracker-2-server-1:3000
```
Запустить dev: `cd client-vue && npm run dev`. Войти (`teacher@gmail.com` / `admin1`), с главной открыть тест по кнопке «Выполнить тест. Вариант 1». Проверить:
- заголовок «{Тема}: Вариант 1», пагинация по количеству вопросов, кнопка «Результаты»;
- все типы вопросов рендерятся и сохраняют ответ при навигации вперёд/назад и через пагинацию (посещённые подсвечиваются);
- картинки вопросов (где есть) грузятся, где нет — без ошибок;
- «Результаты» → экран итогов (3 бара с анимацией), при оценке > 5 — конфетти;
- результат появляется в `/profile` (секция результатов тестов).
Сверить со старым клиентом. Остановить dev и `docker stop vite-api-bridge`.

- [ ] **Step 3: Финальный коммит (если сверка потребовала правок — иначе пропустить)**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && \
git commit -m "fix: pravki po itogam sverki Etapa 5"
```

---

## Definition of Done (Этап 5)

- [ ] `test:unit` зелёный (api/tests, utils/testFormat, utils/testScoring, QuestionPagination, QuestionTypes + накопленные).
- [ ] `type-check`, `build`, `lint` — без ошибок.
- [ ] Тест загружается по `testCode`+`variant`; все 4 типа вопросов работают и сохраняют ответы.
- [ ] Навигация: кнопки «назад/Далее», пагинация с active/visited.
- [ ] Подсчёт баллов/оценки идентичен старому (`ScoreCalculator` покрыт юнит-тестами).
- [ ] Сохранение результата (`POST /test-results`), экран итогов с анимацией и confetti при grade > 5; результат виден в профиле.
- [ ] Маршрут `/test-page` → `TestView`; тач-перетаскивание ordering отмечено как кандидат на доработку в Этапе 7 при необходимости.
- [ ] Все коммиты локально в `feat/vue-rewrite`; `client/` и `server/` не тронуты; на GitHub не запушено.
```
