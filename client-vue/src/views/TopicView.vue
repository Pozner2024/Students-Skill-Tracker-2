<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTopic } from '@/api/topics'
import { renderContent } from '@/utils/topicContent'
import type { Topic } from '@/api/types'

const route = useRoute()
const topic = ref<Topic | null>(null)
const status = ref<'loading' | 'no-id' | 'not-found' | 'error' | 'ready'>('loading')

const title = computed(() => topic.value?.name || 'Тема')
const contentHtml = computed(() => (topic.value ? renderContent(topic.value) : ''))

async function load(): Promise<void> {
  const topicId = route.query.topicId as string | undefined
  if (!topicId) {
    status.value = 'no-id'
    return
  }
  status.value = 'loading'
  try {
    const result = await getTopic(topicId)
    if (result.success && result.topic) {
      topic.value = result.topic
      status.value = 'ready'
    } else {
      status.value = 'not-found'
    }
  } catch {
    status.value = 'error'
  }
}

onMounted(load)
watch(() => route.query.topicId, load)
</script>

<template>
  <main id="topic" class="container my-4">
    <div class="topic-page-header">
      <h1>{{ status === 'ready' ? title : status === 'no-id' ? 'Темы' : 'Тема' }}</h1>
    </div>
    <section>
      <div class="topic-page">
        <div v-if="status === 'loading'" class="topic-loading">Загрузка темы...</div>
        <p v-else-if="status === 'no-id'" class="error-note">ID темы не указан.</p>
        <p v-else-if="status === 'not-found'" class="error-note">Не удалось загрузить тему.</p>
        <p v-else-if="status === 'error'" class="error-note">Ошибка при загрузке темы.</p>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-else v-html="contentHtml"></div>
      </div>
    </section>
  </main>
</template>
