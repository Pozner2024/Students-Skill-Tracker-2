<script setup lang="ts">
import { ref } from 'vue'
import StudentTests from './StudentTests.vue'
import StudentFiles from './StudentFiles.vue'
import { deleteUser } from '@/api/admin'
import { getErrorMessage } from '@/api/errors'
import { useNotificationStore } from '@/stores/notifications'
import type { AdminStudent } from '@/api/types'

const props = defineProps<{ student: AdminStudent; index: number }>()
const emit = defineEmits<{ (e: 'deletedUser', id: number): void }>()

const notify = useNotificationStore()
const open = ref(false)
const fileCount = ref(props.student.files?.length || 0)
const deleting = ref(false)

const fullName = (props.student.fullName || '').trim()
const headerName = `${fullName}${props.student.email ? `, ${props.student.email}` : ''}`

function toggle(): void {
  open.value = !open.value
}

async function onDelete(): Promise<void> {
  const userName = fullName || 'пользователя'
  if (
    !confirm(
      `Вы уверены, что хотите удалить пользователя "${userName}"?\n\nЭто действие удалит:\n- Пользователя\n- Все его тесты\n- Все его файлы\n\nЭто действие нельзя отменить!`,
    )
  ) {
    return
  }
  deleting.value = true
  try {
    const result = await deleteUser(props.student.id)
    if (result.success) {
      notify.success('Пользователь успешно удален')
      emit('deletedUser', props.student.id)
    } else {
      notify.error(result.error || 'Ошибка при удалении пользователя')
      deleting.value = false
    }
  } catch (error) {
    notify.error('Ошибка при удалении пользователя: ' + getErrorMessage(error))
    deleting.value = false
  }
}
</script>

<template>
  <div class="accordion-item" :data-student-id="student.id">
    <div class="accordion-header" :class="{ active: open }" :aria-expanded="open" @click="toggle">
      <span class="student-number">{{ index + 1 }}.</span>
      <span class="student-name">{{ headerName }}</span>
      <div class="header-right-group">
        <span class="tests-count">Тестов: {{ student.tests?.length || 0 }}</span>
        <span
          class="files-indicator"
          :class="{ 'no-files': fileCount === 0 }"
          :data-student-id="student.id"
        >
          {{ fileCount > 0 ? `📁 Файлов: ${fileCount}` : '📁 Нет файлов' }}
        </span>
        <button
          class="delete-user-btn"
          type="button"
          :disabled="deleting"
          title="Удалить пользователя"
          @click.stop="onDelete"
        >
          Удалить
        </button>
        <span class="accordion-icon">▼</span>
      </div>
    </div>
    <div class="accordion-content" :class="{ active: open }">
      <StudentTests :tests="student.tests || []" />
      <StudentFiles
        :files="student.files || []"
        :student-id="student.id"
        @deleted="fileCount = Math.max(0, fileCount - 1)"
      />
    </div>
  </div>
</template>
