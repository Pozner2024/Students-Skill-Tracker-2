<script setup lang="ts">
import { useNotificationStore } from '@/stores/notifications'
const store = useNotificationStore()
</script>

<template>
  <div
    v-for="item in store.items"
    :key="item.id"
    class="error-handler-alert-container position-fixed top-0 start-50 translate-middle-x mt-3 error-handler-alert-z-index"
  >
    <div :class="`alert alert-${item.type} alert-dismissible fade show`" role="alert">
      {{ item.message }}
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        @click="store.remove(item.id)"
      ></button>
    </div>
  </div>
</template>
