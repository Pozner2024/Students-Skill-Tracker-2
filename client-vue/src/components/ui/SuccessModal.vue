<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import background from '@/assets/background.jpg'

withDefaults(
  defineProps<{
    title?: string
    message?: string
    buttonText?: string
  }>(),
  {
    title: 'Успешно!',
    message: 'Операция выполнена успешно',
    buttonText: 'Понятно',
  },
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()

onMounted(() => {
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  document.body.style.overflow = 'auto'
})
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div
      class="modal-content success-modal-content"
      :style="{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }"
    >
      <button class="close-button" @click="emit('close')">×</button>
      <div class="success-icon">✓</div>
      <h3 class="success-title">{{ title }}</h3>
      <div class="modal-body success-modal-body">
        <p class="success-message">{{ message }}</p>
      </div>
      <button class="action-button success-action-button" @click="emit('confirm')">
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>
