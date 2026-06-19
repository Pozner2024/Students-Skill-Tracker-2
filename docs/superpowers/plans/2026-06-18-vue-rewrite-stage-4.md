# Этап 4: Темы (Topics) + Home — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести каталог тем на главную (Home), страницу темы (просмотр контента) и модалки «Контрольные вопросы» / «Тема проекта» — поведение 1-в-1.

**Architecture:** Новый `api/topics.ts` (getTopics/getTopic + кэш). Карточки тем — `components/topics/TopicCard.vue`, каталог с модалками — `components/topics/TopicsCatalog.vue` (использует переиспользуемый `components/ui/BaseModal.vue`). Просмотр темы — `views/TopicView.vue` + чистые утилиты рендера контента `utils/topicContent.ts`. Home (`HomeView.vue`) рендерит заголовок + каталог.

**Tech Stack:** Vue 3 `<script setup>` + TS, Vue Router 4, Pinia, Vitest + @vue/test-utils, Bootstrap 5.

## Global Constraints

- Весь код — в `client-vue/`. `client/` и `server/` НЕ менять.
- Имена компонентов многословные: `HomeView`, `TopicView`, `TopicCard`, `TopicsCatalog`, `BaseModal`.
- Точная копия вёрстки/поведения; CSS переносим **дословно** в `assets/pages/`.
- Эндпоинты (публичные): `GET /topics` → `{ success, topics }`; `GET /topics/:id` → `{ success, topic }`.
- Ветка `feat/vue-rewrite`, коммиты только локально, на GitHub НЕ пушим.
- В конце каждой задачи: `test:unit`, `type-check`, `build`, `lint` — зелёные.

## Перенос и осознанные решения по объёму

| Старое (`client/src/...`) | Новое (`client-vue/src/...`) |
|---|---|
| `components/topics/TopicsRenderer.js` | `api/topics.ts` + `components/topics/TopicCard.vue` |
| `components/topics/Topics.js` | `components/topics/TopicsCatalog.vue` |
| `common/BasicModal.js` | `components/ui/BaseModal.vue` |
| `components/modals/QuestionModal.js` | контент-модалка в `TopicsCatalog` (через BaseModal) |
| `components/modals/ProjectModal.js` | контент-модалка в `TopicsCatalog` + `parseProjectContent` в `utils/topicContent.ts` |
| `pages/Home/Home.js` | `views/HomeView.vue` (наполняем) |
| `pages/TopicPage/{TopicPage,contentRenderer,contentExtractor}.js` | `views/TopicView.vue` + `utils/topicContent.ts` |

**Вне объёма этого этапа (обосновано):**
- **TestModal** — в старом каталоге не вызывается: обработчик `.test-btn` ждёт `topicId` в query, а ссылки карточек его не содержат → клик идёт прямой ссылкой на `/test-page`. Поэтому кнопки тестов делаем обычными ссылками, отдельную TestModal не переносим.
- **Режим редактирования темы (CKEditor) администратором** на странице темы — переносится в **Этап 6** (Admin), там же вся работа с CKEditor. В этом этапе TopicView — только просмотр.

---

## Структура файлов (создаётся в этом этапе)

```
client-vue/src/
├─ api/
│  ├─ topics.ts            getTopics, getTopic (+ кэш)
│  └─ topics.spec.ts
├─ utils/
│  ├─ topicContent.ts      extractTextFromContent, sanitizeHtml, renderContent, parseProjectContent
│  └─ topicContent.spec.ts
├─ components/
│  ├─ ui/BaseModal.vue
│  └─ topics/
│     ├─ TopicCard.vue
│     └─ TopicsCatalog.vue
├─ views/
│  ├─ HomeView.vue         (наполняем) заголовок + каталог
│  └─ TopicView.vue        просмотр темы
└─ assets/
   ├─ pic/pic1..pic12      (копии из client/)
   └─ pages/{home.css, topic.css}
```

---

## Task 1: API тем (TDD)

**Files:**
- Modify: `client-vue/src/api/types.ts`
- Create: `client-vue/src/api/topics.ts`
- Create: `client-vue/src/api/topics.spec.ts`

**Interfaces:**
- Consumes: `http.publicRequest`.
- Produces:
  - `getTopics(): Promise<TopicsResult>`
  - `getTopic(id: string | number): Promise<TopicResult>`
  - типы `Topic`, `TopicProject`, `TopicsResult`, `TopicResult`.

- [ ] **Step 1: Добавить типы в `client-vue/src/api/types.ts`**

```ts
export interface TopicProject {
  name?: string
  description?: string
  content?: { projectTitle?: string; content?: string; html?: string }
}

export interface Topic {
  id: number | string
  name?: string
  project?: TopicProject
  questions?: string[]
  content?: unknown
}

export interface TopicsResult {
  success: boolean
  topics: Topic[]
  error?: string
}

export interface TopicResult {
  success: boolean
  topic: Topic | null
  error?: string
}
```

- [ ] **Step 2: Написать падающий тест `client-vue/src/api/topics.spec.ts`**

```ts
import { describe, it, expect, afterEach, vi } from 'vitest'
import { getTopics, getTopic } from './topics'

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

describe('getTopic', () => {
  it('возвращает тему при success', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ success: true, topic: { id: 1, name: 'Тема' } }))
    const res = await getTopic(1)
    expect(res.success).toBe(true)
    expect(res.topic?.name).toBe('Тема')
  })

  it('возвращает success: false при ошибке', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ success: false }))
    const res = await getTopic(99)
    expect(res.success).toBe(false)
    expect(res.topic).toBeNull()
  })
})
```

- [ ] **Step 3: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- topics.spec
```
Ожидаемо: FAIL (модуль не найден).

- [ ] **Step 4: Создать `client-vue/src/api/topics.ts`**

```ts
import { API_CONFIG } from './config'
import { http } from './http'
import type { Topic, TopicResult, TopicsResult } from './types'

const CACHE_TTL_MS = 5 * 60 * 1000
let topicsCache: Topic[] | null = null
let topicsCacheAt = 0

export async function getTopics(): Promise<TopicsResult> {
  if (topicsCache && Date.now() - topicsCacheAt < CACHE_TTL_MS) {
    return { success: true, topics: topicsCache }
  }
  try {
    const data = await http.publicRequest<{ success?: boolean; topics?: Topic[] }>(
      API_CONFIG.ENDPOINTS.TOPICS,
      { context: 'topics.getTopics' },
    )
    if (data.success && data.topics) {
      topicsCache = data.topics
      topicsCacheAt = Date.now()
      return { success: true, topics: data.topics }
    }
    return { success: false, topics: [], error: 'Неверный формат ответа сервера' }
  } catch (error) {
    return { success: false, topics: [], error: (error as Error).message }
  }
}

export async function getTopic(id: string | number): Promise<TopicResult> {
  try {
    const data = await http.publicRequest<{ success?: boolean; topic?: Topic }>(
      `${API_CONFIG.ENDPOINTS.TOPICS}/${id}`,
      { context: 'topics.getTopic' },
    )
    if (data?.success && data.topic) {
      return { success: true, topic: data.topic }
    }
    return { success: false, topic: null }
  } catch (error) {
    return { success: false, topic: null, error: (error as Error).message }
  }
}
```

- [ ] **Step 5: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- topics.spec
```
Ожидаемо: PASS.

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: api/topics (getTopics/getTopic) с тестами"
```

---

## Task 2: Утилиты контента темы (TDD)

**Files:**
- Create: `client-vue/src/utils/topicContent.ts`
- Create: `client-vue/src/utils/topicContent.spec.ts`

**Interfaces:**
- Produces:
  - `extractTextFromContent(content: unknown): string | null`
  - `sanitizeHtml(html: string): string`
  - `renderContent(topic: Topic): string` (готовый HTML для вставки через `v-html`)
  - `parseProjectContent(project?: TopicProject): { html: string | null; title: string; description: string }`

- [ ] **Step 1: Написать падающий тест `client-vue/src/utils/topicContent.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { extractTextFromContent, renderContent, parseProjectContent } from './topicContent'

describe('extractTextFromContent', () => {
  it('строку возвращает как есть', () => {
    expect(extractTextFromContent('Привет')).toBe('Привет')
  })
  it('массив секций объединяет по contentHtml', () => {
    const res = extractTextFromContent([{ contentHtml: '<p>A</p>' }, { contentHtml: '<p>B</p>' }])
    expect(res).toContain('<p>A</p>')
    expect(res).toContain('<p>B</p>')
  })
  it('пустой контент — null', () => {
    expect(extractTextFromContent(null)).toBeNull()
  })
})

describe('renderContent', () => {
  it('пустой контент — заметка-заглушка', () => {
    expect(renderContent({ id: 1 })).toMatch(/Содержание темы пока не добавлено/)
  })
  it('строковый контент попадает в .topic-content', () => {
    expect(renderContent({ id: 1, content: '<p>Текст</p>' })).toContain('topic-content')
  })
})

describe('parseProjectContent', () => {
  it('берёт name и description, html по умолчанию null', () => {
    const r = parseProjectContent({ name: 'Проект', description: 'Описание' })
    expect(r.title).toBe('Проект')
    expect(r.description).toBe('Описание')
    expect(r.html).toBeNull()
  })
})
```

- [ ] **Step 2: Запустить — падает**

```bash
cd client-vue && npm run test:unit -- topicContent
```
Ожидаемо: FAIL.

- [ ] **Step 3: Создать `client-vue/src/utils/topicContent.ts`**

```ts
import type { Topic, TopicProject } from '@/api/types'

export function extractTextFromContent(content: unknown): string | null {
  if (!content) return null

  if (Array.isArray(content)) {
    if (content.length === 0) return null
    const parts = content
      .map((section) => {
        if (section && typeof section === 'object') {
          const s = section as Record<string, unknown>
          if (typeof s.contentHtml === 'string') return s.contentHtml.trim()
          if (typeof s.html === 'string') return s.html.trim()
          for (const field of ['text', 'content', 'body', 'description']) {
            const v = s[field]
            if (typeof v === 'string' && v.trim().length > 0) return v.trim()
          }
        }
        return null
      })
      .filter((html): html is string => !!html && html.trim().length > 0)
    return parts.length > 0 ? parts.join('\n\n') : null
  }

  if (typeof content === 'string') {
    try {
      return extractTextFromContent(JSON.parse(content))
    } catch {
      return content.trim()
    }
  }

  if (typeof content === 'object') {
    const obj = content as Record<string, unknown>
    for (const field of ['html', 'text', 'content', 'description']) {
      const v = obj[field]
      if (typeof v === 'string' && v.trim().length > 0) return v.trim()
      if (v && typeof v === 'object') {
        const nested = extractTextFromContent(v)
        if (nested) return nested
      }
    }
    const strings = Object.entries(obj)
      .filter(([k, v]) => k !== 'title' && typeof v === 'string' && (v as string).trim().length > 0)
      .map(([, v]) => (v as string).trim())
      .join('\n\n')
    return strings.length > 0 ? strings : null
  }

  return null
}

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div', 'pre', 'code',
]

export function sanitizeHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  tmp.querySelectorAll('script, iframe, object, embed, form, input').forEach((el) => el.remove())
  tmp.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (!['href', 'class', 'id'].includes(attr.name)) {
        el.removeAttribute(attr.name)
      } else if (
        attr.name === 'href' &&
        (attr.value.startsWith('javascript:') || attr.value.startsWith('data:'))
      ) {
        el.removeAttribute(attr.name)
      }
    })
    if (!ALLOWED_TAGS.includes(el.tagName.toLowerCase())) {
      const parent = el.parentNode
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el)
        parent.removeChild(el)
      }
    }
  })
  return tmp.innerHTML
}

export function renderContent(topic: Topic): string {
  if (!topic) return '<p class="error-note">Тема не найдена.</p>'

  if (Array.isArray(topic.content) && topic.content.length > 0) {
    const sectionsHtml = (topic.content as Array<Record<string, unknown>>)
      .map((section) => {
        if (section && typeof section === 'object') {
          const title = section.title
          const contentHtml = (section.contentHtml || section.html) as string | undefined
          if (contentHtml && contentHtml.trim().length > 0) {
            const sanitized = sanitizeHtml(contentHtml.trim())
            if (title) {
              const titleText =
                typeof title === 'string' ? title.replace(/<[^>]*>/g, '').trim() : String(title)
              return `<div class="topic-section"><h3 class="topic-section-title">${titleText}</h3><div class="topic-section-content">${sanitized}</div></div>`
            }
            return `<div class="topic-section"><div class="topic-section-content">${sanitized}</div></div>`
          }
        }
        return null
      })
      .filter((html): html is string => html !== null)
      .join('')
    if (sectionsHtml.trim().length > 0) {
      return `<div class="topic-content">${sectionsHtml}</div>`
    }
  }

  const textContent = extractTextFromContent(topic.content)
  if (!textContent || textContent.trim().length === 0) {
    return '<p class="placeholder-note">Содержание темы пока не добавлено.</p>'
  }
  return `<div class="topic-content">${sanitizeHtml(textContent)}</div>`
}

export function parseProjectContent(project?: TopicProject): {
  html: string | null
  title: string
  description: string
} {
  const parsePayload = (description?: string): Record<string, unknown> | null => {
    if (typeof description !== 'string') return null
    let parsed: unknown = null
    try {
      parsed = JSON.parse(description)
    } catch {
      parsed = null
    }
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed)
      } catch {
        parsed = null
      }
    }
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
    if (description.includes('<h2>') || description.includes('<h3>')) {
      return { content: description }
    }
    return null
  }

  const payload = parsePayload(project?.description)
  const title =
    project?.content?.projectTitle ||
    (payload?.projectTitle as string) ||
    project?.name ||
    'Неизвестная тема проекта'
  const html =
    project?.content?.content ||
    project?.content?.html ||
    (payload?.content as string) ||
    null
  const description = project?.description || 'Описание проекта отсутствует.'
  return { html, title, description }
}
```

- [ ] **Step 4: Запустить — проходит**

```bash
cd client-vue && npm run test:unit -- topicContent
```
Ожидаемо: PASS.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: utils/topicContent (рендер/санитайз/проект) с тестами"
```

---

## Task 3: Переиспользуемая модалка + ассеты картинок

**Files:**
- Create: `client-vue/src/components/ui/BaseModal.vue`
- Create: `client-vue/src/assets/pic/pic1.jpg ... pic12.jpg` (копии из `client/`)

**Interfaces:**
- Consumes: фон `@/assets/background.jpg`, `assets/ui/modal.css` (уже подключён в Этапе 2).
- Produces: `BaseModal` с props `{ customClass?: string; buttonText?: string }`, emit `confirm`, `close`, слот по умолчанию для тела.

- [ ] **Step 1: Скопировать картинки тем**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && mkdir -p client-vue/src/assets/pic && \
cp client/src/assets/pic/pic1.jpg client/src/assets/pic/pic2.jpg client/src/assets/pic/pic3.jpg \
   client/src/assets/pic/pic4.jpg client/src/assets/pic/pic5.jpg client/src/assets/pic/pic6.jpg \
   client/src/assets/pic/pic7.jpg client/src/assets/pic/pic8.jpg client/src/assets/pic/pic9jpg.jpg \
   client/src/assets/pic/pic10.jpg client/src/assets/pic/pic11.jpg client/src/assets/pic/pic12.jpg \
   client-vue/src/assets/pic/ && echo ok && ls client-vue/src/assets/pic | wc -l
```
Ожидаемо: 12 файлов.

- [ ] **Step 2: Создать `client-vue/src/components/ui/BaseModal.vue`**

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import background from '@/assets/background.jpg'

withDefaults(
  defineProps<{ customClass?: string; buttonText?: string }>(),
  { customClass: 'modal-overlay', buttonText: 'Закрыть' },
)

const emit = defineEmits<{ (e: 'confirm'): void; (e: 'close'): void }>()

onMounted(() => {
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  document.body.style.overflow = 'auto'
})
</script>

<template>
  <div :class="customClass" @click.self="emit('close')">
    <div
      class="modal-content"
      :style="{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }"
    >
      <button class="close-button" @click="emit('close')">×</button>
      <div class="modal-body"><slot /></div>
      <button class="btn btn-primary action-button" @click="emit('confirm')">
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Проверить сборку**

```bash
cd client-vue && npm run build
```
Ожидаемо: без ошибок.

- [ ] **Step 4: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: BaseModal и картинки тем"
```

---

## Task 4: Карточка темы и каталог с модалками

**Files:**
- Create: `client-vue/src/components/topics/TopicCard.vue`
- Create: `client-vue/src/components/topics/TopicsCatalog.vue`

**Interfaces:**
- Consumes: `getTopics`, `parseProjectContent`, `BaseModal`, типы `Topic`.
- Produces:
  - `TopicCard` — props `{ topic: Topic; picture: string; index: number }`, emit `openProject`, `openQuestions`.
  - `TopicsCatalog` — самостоятельно грузит темы, рендерит сетку и модалки.

- [ ] **Step 1: Создать `client-vue/src/components/topics/TopicCard.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Topic } from '@/api/types'

const props = defineProps<{ topic: Topic; picture: string; index: number }>()
const emit = defineEmits<{ (e: 'openProject'): void; (e: 'openQuestions'): void }>()

const topicId = computed(() => props.topic.id ?? props.index + 1)
const topicName = computed(() => props.topic.name || 'Тема неизвестна')
</script>

<template>
  <div class="col-12 col-sm-6 col-md-4 col-lg-4 mb-4">
    <div
      class="card h-100 rectangle card-hover-effect card-appear"
      :style="{ animationDelay: `${index * 0.1}s` }"
    >
      <img :src="picture" alt="Изображение темы" class="card-img-top rectangle-image" />
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">
          <RouterLink :to="`/topic?topicId=${topicId}`" class="card-title-link"
            >Тема: {{ topicName }}</RouterLink
          >
        </h5>
        <div class="buttons-container mt-auto">
          <RouterLink
            :to="`/test-page?variant=1&testCode=test${topicId}_1&title=${encodeURIComponent(topicName)}`"
            class="btn btn-primary mb-2 test-btn w-100"
            >Выполнить тест. Вариант 1</RouterLink
          >
          <RouterLink
            :to="`/test-page?variant=2&testCode=test${topicId}_2&title=${encodeURIComponent(topicName)}`"
            class="btn btn-primary mb-2 test-btn w-100"
            >Выполнить тест. Вариант 2</RouterLink
          >
          <button class="btn btn-success mb-2 project-info-btn w-100" @click="emit('openProject')">
            Узнать тему проекта
          </button>
          <button class="btn btn-info control-question-btn w-100" @click="emit('openQuestions')">
            Контрольные вопросы
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Создать `client-vue/src/components/topics/TopicsCatalog.vue`**

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getTopics } from '@/api/topics'
import { parseProjectContent } from '@/utils/topicContent'
import type { Topic } from '@/api/types'
import TopicCard from './TopicCard.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import pic1 from '@/assets/pic/pic1.jpg'
import pic2 from '@/assets/pic/pic2.jpg'
import pic3 from '@/assets/pic/pic3.jpg'
import pic4 from '@/assets/pic/pic4.jpg'
import pic5 from '@/assets/pic/pic5.jpg'
import pic6 from '@/assets/pic/pic6.jpg'
import pic7 from '@/assets/pic/pic7.jpg'
import pic8 from '@/assets/pic/pic8.jpg'
import pic9 from '@/assets/pic/pic9jpg.jpg'
import pic10 from '@/assets/pic/pic10.jpg'
import pic11 from '@/assets/pic/pic11.jpg'
import pic12 from '@/assets/pic/pic12.jpg'

const pictures = [pic1, pic2, pic3, pic4, pic5, pic6, pic7, pic8, pic9, pic10, pic11, pic12]

const topics = ref<Topic[]>([])
const loadError = ref('')
const activeModal = ref<'question' | 'project' | null>(null)
const selected = ref<Topic | null>(null)

async function load(): Promise<void> {
  const result = await getTopics()
  if (result.success) {
    topics.value = result.topics
    loadError.value = ''
  } else {
    loadError.value =
      result.error || 'Не удалось загрузить тесты. Пожалуйста, обновите страницу.'
  }
}

onMounted(load)

function openQuestions(topic: Topic): void {
  selected.value = topic
  activeModal.value = 'question'
}

function openProject(topic: Topic): void {
  selected.value = topic
  activeModal.value = 'project'
}

function closeModal(): void {
  activeModal.value = null
  selected.value = null
}

const project = computed(() => parseProjectContent(selected.value?.project))
</script>

<template>
  <div id="topics-section" class="topics-container">
    <div v-if="loadError" class="alert alert-danger" role="alert">
      <h4 class="alert-heading">Ошибка загрузки тестов</h4>
      <p>{{ loadError }}</p>
      <hr />
      <button class="btn btn-primary" @click="load">Повторить загрузку</button>
    </div>

    <div v-else class="rectangles-container row g-4">
      <TopicCard
        v-for="(topic, index) in topics"
        :key="topic.id ?? index"
        :topic="topic"
        :picture="pictures[index % pictures.length]"
        :index="index"
        @open-questions="openQuestions(topic)"
        @open-project="openProject(topic)"
      />
    </div>

    <BaseModal
      v-if="activeModal === 'question'"
      custom-class="modal-overlay question-modal"
      @confirm="closeModal"
      @close="closeModal"
    >
      <h2 class="mb-3">Тема: {{ selected?.name || 'Неизвестная тема' }}</h2>
      <h3 class="mb-3">Контрольные вопросы:</h3>
      <ol v-if="selected?.questions && selected.questions.length">
        <li v-for="(q, i) in selected.questions" :key="i">{{ q }}</li>
      </ol>
      <p v-else>Нет доступных вопросов для этой темы.</p>
    </BaseModal>

    <BaseModal
      v-if="activeModal === 'project'"
      custom-class="modal-overlay project-modal"
      @confirm="closeModal"
      @close="closeModal"
    >
      <div v-if="project.html" v-html="project.html"></div>
      <template v-else>
        <h2 class="mb-3">Тема проекта: {{ project.title }}</h2>
        <p class="mb-0">{{ project.description }}</p>
      </template>
    </BaseModal>
  </div>
</template>
```

- [ ] **Step 3: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: всё зелёное. (Предупреждение eslint про `v-html` допустимо — контент админский; при необходимости отключить правило для строки комментарием `<!-- eslint-disable-next-line vue/no-v-html -->`.)

- [ ] **Step 4: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: TopicCard и TopicsCatalog с модалками"
```

---

## Task 5: Home с каталогом

**Files:**
- Create: `client-vue/src/assets/pages/home.css` (копия `client/src/pages/Home/Home.css`)
- Modify: `client-vue/src/views/HomeView.vue`
- Modify: `client-vue/src/main.ts` (импорт home.css)

**Interfaces:**
- Consumes: `TopicsCatalog`.
- Produces: `HomeView` — заголовок «Каталог тем» + каталог.

- [ ] **Step 1: Скопировать CSS главной**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && cp client/src/pages/Home/Home.css client-vue/src/assets/pages/home.css && echo ok
```

- [ ] **Step 2: Заменить содержимое `client-vue/src/views/HomeView.vue`**

```vue
<script setup lang="ts">
import TopicsCatalog from '@/components/topics/TopicsCatalog.vue'
</script>

<template>
  <main id="home" class="container my-4">
    <h1 class="text-center mb-4">Каталог тем</h1>
    <section>
      <TopicsCatalog />
    </section>
  </main>
</template>
```

- [ ] **Step 3: Подключить CSS в `client-vue/src/main.ts`**

```ts
import '@/assets/pages/home.css'
```

- [ ] **Step 4: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: всё зелёное.

- [ ] **Step 5: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: каталог тем на главной (Home)"
```

---

## Task 6: Страница темы (просмотр)

**Files:**
- Create: `client-vue/src/assets/pages/topic.css` (копия `client/src/pages/TopicPage/TopicPage.css`)
- Create: `client-vue/src/views/TopicView.vue`
- Modify: `client-vue/src/router/index.ts` (topic → TopicView)
- Modify: `client-vue/src/main.ts` (импорт topic.css)

**Interfaces:**
- Consumes: `getTopic`, `renderContent`, тип `Topic`, query-параметр `topicId`.
- Produces: `TopicView` — просмотр темы (режим редактирования админом — Этап 6).

- [ ] **Step 1: Скопировать CSS темы**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && cp client/src/pages/TopicPage/TopicPage.css client-vue/src/assets/pages/topic.css && echo ok
```

- [ ] **Step 2: Создать `client-vue/src/views/TopicView.vue`**

```vue
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTopic } from '@/api/topics'
import { renderContent } from '@/utils/topicContent'
import type { Topic } from '@/api/types'

const route = useRoute()
const topic = ref<Topic | null>(null)
const status = ref<'loading' | 'no-id' | 'not-found' | 'error' | 'ready'>('loading')

const title = computed(() => topic.value?.name || 'Тема')
const contentHtml = computed(() => (topic.value ? renderContent(topic.value) : ''))

async function load(): Promise<void> {
  const topicId = route.query.topicId as string | undefined
  if (!topicId) {
    status.value = 'no-id'
    return
  }
  status.value = 'loading'
  try {
    const result = await getTopic(topicId)
    if (result.success && result.topic) {
      topic.value = result.topic
      status.value = 'ready'
    } else {
      status.value = 'not-found'
    }
  } catch {
    status.value = 'error'
  }
}

onMounted(load)
watch(() => route.query.topicId, load)
</script>

<template>
  <main id="topic" class="container my-4">
    <div class="topic-page-header">
      <h1>{{ status === 'ready' ? title : status === 'no-id' ? 'Темы' : 'Тема' }}</h1>
    </div>
    <section>
      <div class="topic-page">
        <div v-if="status === 'loading'" class="topic-loading">Загрузка темы...</div>
        <p v-else-if="status === 'no-id'" class="error-note">ID темы не указан.</p>
        <p v-else-if="status === 'not-found'" class="error-note">Не удалось загрузить тему.</p>
        <p v-else-if="status === 'error'" class="error-note">Ошибка при загрузке темы.</p>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-else v-html="contentHtml"></div>
      </div>
    </section>
  </main>
</template>
```

- [ ] **Step 3: Подключить CSS в `client-vue/src/main.ts`**

```ts
import '@/assets/pages/topic.css'
```

- [ ] **Step 4: Переключить маршрут `topic` в `client-vue/src/router/index.ts`**

Добавить `import TopicView from '@/views/TopicView.vue'` и в маршруте `topic` заменить `component: PlaceholderView` на `TopicView`.

- [ ] **Step 5: type-check, build, lint**

```bash
cd client-vue && npm run type-check && npm run build && npm run lint
```
Ожидаемо: всё зелёное.

- [ ] **Step 6: Коммит**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue
git commit -m "feat: страница темы (просмотр) TopicView"
```

---

## Task 7: Финальная проверка

**Files:** (изменений кода нет — проверка)

- [ ] **Step 1: Полный прогон**

```bash
cd client-vue && npm run test:unit && npm run type-check && npm run build && npm run lint
```
Ожидаемо: все тесты зелёные, без ошибок.

- [ ] **Step 2: Ручная сверка (dev-сервер, нужен сервер на :3000)**

```bash
cd client-vue && npm run dev
```
Войти, открыть `/` — карточки тем с анимацией; «Контрольные вопросы» и «Тема проекта» открывают модалки; кнопки тестов ведут на `/test-page?...`; клик по названию темы → `/topic?topicId=...` показывает контент. Сверить со старым клиентом. Остановить сервер.

- [ ] **Step 3: Финальный коммит (если ручная сверка потребовала правок — иначе пропустить)**

```bash
cd "D:/Наташа/Students-Skill-Tracker-2" && git add -A client-vue && git commit -m "fix: правки по итогам сверки Этапа 4"
```

---

## Definition of Done (Этап 4)

- [ ] `test:unit` зелёный (api/topics, utils/topicContent + накопленные).
- [ ] `type-check`, `build`, `lint` — без ошибок.
- [ ] Home показывает каталог тем (карточки, картинки, анимация, состояние ошибки с повтором).
- [ ] Модалки «Контрольные вопросы» и «Тема проекта» работают; кнопки тестов ведут на `/test-page`.
- [ ] Страница темы (`/topic?topicId=`) рендерит контент (секции/HTML/заглушка), состояния no-id/not-found/error.
- [ ] Маршруты `/` и `/topic` → реальные компоненты; админ-редактирование темы отложено в Этап 6.
- [ ] Все коммиты локально в `feat/vue-rewrite`; `client/` и `server/` не тронуты; на GitHub не запушено.
```
