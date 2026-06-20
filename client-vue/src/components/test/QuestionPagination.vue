<script setup lang="ts">
const props = defineProps<{ total: number; current: number; visited: number[] }>()
const emit = defineEmits<{ (e: 'select', index: number): void }>()
</script>

<template>
  <button
    v-for="i in props.total"
    :key="i - 1"
    class="page-button"
    :class="{ active: i - 1 === props.current, visited: props.visited.includes(i - 1) }"
    @click="emit('select', i - 1)"
  >
    {{ i }}
  </button>
</template>
