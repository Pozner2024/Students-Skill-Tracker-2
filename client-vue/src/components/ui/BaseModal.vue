<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import background from '@/assets/background.jpg'

withDefaults(defineProps<{ customClass?: string; buttonText?: string }>(), {
  customClass: 'modal-overlay',
  buttonText: 'Закрыть',
})

const emit = defineEmits<{ (e: 'confirm'): void; (e: 'close'): void }>()

onMounted(() => {
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  document.body.style.overflow = 'auto'
})
</script>

<template>
  <div :class="customClass" @click.self="emit('close')">
    <div
      class="modal-content"
      :style="{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }"
    >
      <button class="close-button" @click="emit('close')">×</button>
      <div class="modal-body"><slot /></div>
      <button class="btn btn-primary action-button" @click="emit('confirm')">
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>
