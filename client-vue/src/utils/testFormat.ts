export type FillSegment =
  | { kind: 'text'; text: string }
  | { kind: 'input'; blankIndex: number; prefix: string; punctuation: string; value: string }

// Порт QuestionRenderer.formatUnits — неразрывный пробел перед %, °C/°С, см.
// Вставляем литеральный U+00A0 (а не &nbsp;-сущность), чтобы текст можно было
// выводить через интерполяцию {{ }} без v-html (визуально идентично).
const NBSP = '\u00a0'
export function formatUnits(text: string): string {
  if (!text) return text
  return text.replace(/(\d)\s*(%|°\s*[CС]|см\b)/gi, (match, digit, unit) => {
    if (unit === '%') return `${digit}${NBSP}%`
    if (unit.includes('°')) {
      const symbol = /[Сс]/.test(unit) ? '°С' : '°C'
      return `${digit}${NBSP}${symbol}`
    }
    if (unit.includes('см')) return `${digit}${NBSP}см`
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
      segments.push({ kind: 'text', text: formatted.slice(lastIndex, match.index) })
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
    segments.push({ kind: 'text', text: formatted.slice(lastIndex) })
  }
  return segments
}
