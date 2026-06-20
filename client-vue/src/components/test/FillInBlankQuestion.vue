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
      <span v-if="seg.kind === 'text'">{{ seg.text }}</span>
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
