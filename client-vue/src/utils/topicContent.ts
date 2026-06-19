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
    project?.content?.content || project?.content?.html || (payload?.content as string) || null
  const description = project?.description || 'Описание проекта отсутствует.'
  return { html, title, description }
}
