<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTopic, updateTopicContent } from '@/api/topics'
import { renderContent, extractTextFromContent } from '@/utils/topicContent'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import CkeditorClassic from '@/components/editors/CkeditorClassic.vue'
import type { Topic } from '@/api/types'

const route = useRoute()
const auth = useAuthStore()
const notify = useNotificationStore()

const topic = ref<Topic | null>(null)
const status = ref<'loading' | 'no-id' | 'not-found' | 'error' | 'ready'>('loading')

const isEditMode = ref(false)
const editorData = ref('')
const saving = ref(false)

const isAdmin = computed(() => auth.user?.role === 'admin')
const title = computed(() => topic.value?.name || 'Тема')
const contentHtml = computed(() => (topic.value ? renderContent(topic.value) : ''))

async function load(): Promise<void> {
  const topicId = route.query.topicId as string | undefined
  if (!topicId) {
    status.value = 'no-id'
    return
  }
  status.value = 'loading'
  isEditMode.value = false
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

function startEdit(): void {
  if (!topic.value) return
  editorData.value = extractTextFromContent(topic.value.content) || ''
  isEditMode.value = true
}

function cancelEdit(): void {
  isEditMode.value = false
}

async function save(): Promise<void> {
  if (!topic.value) return
  saving.value = true
  try {
    const result = await updateTopicContent(topic.value.id, editorData.value)
    if (result.success) {
      topic.value = { ...topic.value, content: editorData.value }
      isEditMode.value = false
      notify.success('Контент успешно сохранен!')
    } else {
      notify.error(`Ошибка: ${result.error || 'не удалось сохранить'}`)
    }
  } finally {
    saving.value = false
  }
}

onMounted(load)
watch(() => route.query.topicId, load)
</script>

<template>
  <main id="topic" class="container my-4">
    <div class="topic-page-header">
      <h1>{{ status === 'ready' ? title : status === 'no-id' ? 'Темы' : 'Тема' }}</h1>
      <div
        v-if="status === 'ready' && isAdmin && !isEditMode"
        class="topic-actions topic-actions--edit"
      >
        <button class="btn btn-primary" @click="startEdit">Редактировать</button>
      </div>
      <div v-else-if="status === 'ready' && isAdmin && isEditMode" class="topic-actions">
        <button class="btn btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
        </button>
        <button class="btn btn-secondary" :disabled="saving" @click="cancelEdit">Отмена</button>
      </div>
    </div>
    <section>
      <div class="topic-page" :class="{ 'edit-mode': isEditMode }">
        <div v-if="status === 'loading'" class="topic-loading">Загрузка темы...</div>
        <p v-else-if="status === 'no-id'" class="error-note">ID темы не указан.</p>
        <p v-else-if="status === 'not-found'" class="error-note">Не удалось загрузить тему.</p>
        <p v-else-if="status === 'error'" class="error-note">Ошибка при загрузке темы.</p>
        <div v-else-if="isEditMode" class="topic-editor-container">
          <CkeditorClassic v-model="editorData" />
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-else v-html="contentHtml"></div>
      </div>
    </section>
  </main>
</template>
