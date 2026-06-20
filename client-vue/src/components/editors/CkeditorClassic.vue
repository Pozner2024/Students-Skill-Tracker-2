<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string }>(), {
  placeholder: 'Введите содержание темы...',
})
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const el = ref<HTMLDivElement | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let editor: any = null

onMounted(async () => {
  if (!el.value) return
  editor = await ClassicEditor.create(el.value, {
    placeholder: props.placeholder,
    toolbar: [
      'heading',
      '|',
      'bold',
      'italic',
      'underline',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'blockQuote',
      'link',
      '|',
      'undo',
      'redo',
    ],
  })
  editor.setData(props.modelValue || '')
  editor.model.document.on('change:data', () => {
    emit('update:modelValue', editor.getData())
  })
})

onBeforeUnmount(async () => {
  if (editor) {
    await editor.destroy()
    editor = null
  }
})
</script>

<template>
  <div ref="el"></div>
</template>
