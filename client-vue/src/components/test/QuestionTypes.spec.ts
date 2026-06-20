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
