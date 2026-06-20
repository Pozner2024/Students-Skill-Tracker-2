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
        <p v-if="props.question.questionDescription">
          {{ formatUnits(props.question.questionDescription) }}
        </p>
        <p v-if="props.question.type !== 'fill_in_the_blank'">
          {{ formatUnits(props.question.question || '') }}
        </p>
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
        <img
          :src="props.imagePath as string"
          alt=""
          loading="lazy"
          referrerpolicy="no-referrer"
          @error="hideImage"
        />
      </div>
    </div>
  </div>
</template>
