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
          <option
            v-for="(r, ri) in props.question.right_column || []"
            :key="ri"
            :value="r"
            :title="r"
          >
            {{ r }}
          </option>
        </select>
      </li>
    </ul>
  </div>
</template>
