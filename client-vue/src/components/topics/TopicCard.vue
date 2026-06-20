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
