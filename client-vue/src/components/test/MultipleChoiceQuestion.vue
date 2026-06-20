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
      <span>{{ formatUnits(option) }}</span><br />
    </label>
  </template>
  <p v-else>Ошибка: варианты ответов не найдены</p>
</template>
