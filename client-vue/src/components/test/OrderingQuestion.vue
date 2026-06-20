<script setup lang="ts">
import { ref, watch } from 'vue'
import dragIcon from '@/assets/icons/drag-dots.svg'
import type { TestQuestionData } from '@/api/types'

const props = defineProps<{ question: TestQuestionData; index: number; modelValue: unknown }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string[]): void }>()

const items = ref<string[]>(
  Array.isArray(props.modelValue) && (props.modelValue as string[]).length
    ? [...(props.modelValue as string[])]
    : [...(props.question.sequence || [])],
)

watch(
  () => props.modelValue,
  (val) => {
    if (Array.isArray(val) && val.length) items.value = [...(val as string[])]
  },
)

function save(): void {
  emit('update:modelValue', [...items.value])
}

// --- Desktop DnD ---
let dragFrom: number | null = null
function onDragStart(i: number, e: DragEvent): void {
  dragFrom = i
  e.dataTransfer?.setData('text/plain', String(i))
  ;(e.target as HTMLElement).classList.add('dragging')
}
function onDragOver(e: DragEvent): void {
  e.preventDefault()
}
function onDrop(to: number, e: DragEvent): void {
  e.preventDefault()
  if (dragFrom === null || dragFrom === to) return
  const next = [...items.value]
  const [moved] = next.splice(dragFrom, 1)
  next.splice(to, 0, moved)
  items.value = next
  dragFrom = null
  save()
}
function onDragEnd(e: DragEvent): void {
  ;(e.target as HTMLElement).classList.remove('dragging')
  dragFrom = null
}
</script>

<template>
  <ul class="ordering-list" :id="`ordering_${props.index}`" @dragover="onDragOver">
    <li
      v-for="(item, i) in items"
      :key="`${item}-${i}`"
      class="draggable-item"
      draggable="true"
      :data-index="i"
      @dragstart="onDragStart(i, $event)"
      @drop="onDrop(i, $event)"
      @dragend="onDragEnd"
    >
      <span class="draggable-item-text">{{ item }}</span>
      <img class="draggable-item-icon" :src="dragIcon" alt="" />
    </li>
  </ul>
</template>
