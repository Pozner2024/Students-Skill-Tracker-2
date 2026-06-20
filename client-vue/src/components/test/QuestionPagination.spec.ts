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
