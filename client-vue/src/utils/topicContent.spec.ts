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
