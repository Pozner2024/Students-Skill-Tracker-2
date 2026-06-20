<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getTopics } from '@/api/topics'
import { parseProjectContent, sanitizeHtml } from '@/utils/topicContent'
import type { Topic } from '@/api/types'
import TopicCard from './TopicCard.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import pic1 from '@/assets/pic/pic1.jpg'
import pic2 from '@/assets/pic/pic2.jpg'
import pic3 from '@/assets/pic/pic3.jpg'
import pic4 from '@/assets/pic/pic4.jpg'
import pic5 from '@/assets/pic/pic5.jpg'
import pic6 from '@/assets/pic/pic6.jpg'
import pic7 from '@/assets/pic/pic7.jpg'
import pic8 from '@/assets/pic/pic8.jpg'
import pic9 from '@/assets/pic/pic9jpg.jpg'
import pic10 from '@/assets/pic/pic10.jpg'
import pic11 from '@/assets/pic/pic11.jpg'
import pic12 from '@/assets/pic/pic12.jpg'

const pictures = [pic1, pic2, pic3, pic4, pic5, pic6, pic7, pic8, pic9, pic10, pic11, pic12]

const topics = ref<Topic[]>([])
const loadError = ref('')
const activeModal = ref<'question' | 'project' | null>(null)
const selected = ref<Topic | null>(null)

async function load(): Promise<void> {
  const result = await getTopics()
  if (result.success) {
    topics.value = result.topics
    loadError.value = ''
  } else {
    loadError.value = result.error || 'Не удалось загрузить тесты. Пожалуйста, обновите страницу.'
  }
}

onMounted(load)

function openQuestions(topic: Topic): void {
  selected.value = topic
  activeModal.value = 'question'
}

function openProject(topic: Topic): void {
  selected.value = topic
  activeModal.value = 'project'
}

function closeModal(): void {
  activeModal.value = null
  selected.value = null
}

const project = computed(() => parseProjectContent(selected.value?.project))
// Санитизируем HTML проекта (серверный контент) перед v-html — как и контент темы.
const projectHtml = computed(() => (project.value.html ? sanitizeHtml(project.value.html) : null))
</script>

<template>
  <div id="topics-section" class="topics-container">
    <div v-if="loadError" class="alert alert-danger" role="alert">
      <h4 class="alert-heading">Ошибка загрузки тестов</h4>
      <p>{{ loadError }}</p>
      <hr />
      <button class="btn btn-primary" @click="load">Повторить загрузку</button>
    </div>

    <div v-else class="rectangles-container row g-4">
      <TopicCard
        v-for="(topic, index) in topics"
        :key="topic.id ?? index"
        :topic="topic"
        :picture="pictures[index % pictures.length]"
        :index="index"
        @open-questions="openQuestions(topic)"
        @open-project="openProject(topic)"
      />
    </div>

    <BaseModal
      v-if="activeModal === 'question'"
      custom-class="modal-overlay question-modal"
      @confirm="closeModal"
      @close="closeModal"
    >
      <h2 class="mb-3">Тема: {{ selected?.name || 'Неизвестная тема' }}</h2>
      <h3 class="mb-3">Контрольные вопросы:</h3>
      <ol v-if="selected?.questions && selected.questions.length">
        <li v-for="(q, i) in selected.questions" :key="i">{{ q }}</li>
      </ol>
      <p v-else>Нет доступных вопросов для этой темы.</p>
    </BaseModal>

    <BaseModal
      v-if="activeModal === 'project'"
      custom-class="modal-overlay project-modal"
      @confirm="closeModal"
      @close="closeModal"
    >
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="projectHtml" v-html="projectHtml"></div>
      <template v-else>
        <h2 class="mb-3">Тема проекта: {{ project.title }}</h2>
        <p class="mb-0">{{ project.description }}</p>
      </template>
    </BaseModal>
  </div>
</template>
