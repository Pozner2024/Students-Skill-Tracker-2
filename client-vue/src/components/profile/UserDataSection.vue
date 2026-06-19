<script setup lang="ts">
import { ref } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { validateGroupNumber } from '@/api/validation'
import { updateProfile, getCurrentUser } from '@/api/users'
import { getErrorMessage } from '@/api/errors'
import type { User } from '@/api/types'

const props = defineProps<{ user: User }>()
const emit = defineEmits<{ (e: 'updated'): void }>()
const notify = useNotificationStore()

type Field = 'fullName' | 'groupNumber'

const editing = ref<Field | null>(null)
const draft = ref('')
const saving = ref(false)

function startEdit(field: Field): void {
  editing.value = field
  draft.value = String(props.user[field] ?? '')
}

function cancelEdit(): void {
  editing.value = null
  draft.value = ''
}

async function saveEdit(field: Field): Promise<void> {
  const newValue = draft.value.trim()
  const original = String(props.user[field] ?? '')
  if (newValue === original) {
    cancelEdit()
    return
  }
  if (!newValue) {
    notify.warning(
      `${field === 'fullName' ? 'Фамилия и Имя' : 'Номер группы'} не может быть пустым`,
    )
    return
  }
  if (field === 'groupNumber') {
    const groupError = validateGroupNumber(newValue)
    if (groupError) {
      notify.warning(groupError)
      return
    }
  }
  saving.value = true
  try {
    const current = await getCurrentUser()
    if (!current.success || !current.user) {
      throw new Error('Не удалось загрузить текущие данные пользователя')
    }
    const fullName = field === 'fullName' ? newValue : current.user.fullName || ''
    const groupNumber = field === 'groupNumber' ? newValue : current.user.groupNumber || ''
    const result = await updateProfile(fullName, groupNumber)
    if (result.success) {
      notify.success('Данные успешно сохранены!')
      editing.value = null
      emit('updated')
    } else {
      notify.error('Ошибка при сохранении: ' + getErrorMessage(result))
    }
  } catch (error) {
    notify.error('Ошибка при сохранении: ' + getErrorMessage(error))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="props.user.fullName || props.user.groupNumber" class="user-data-section">
    <h3>Ваши данные:</h3>
    <div class="user-data">
      <div class="data-item">
        <span class="data-label">Email:</span>
        <span class="data-value">{{ props.user.email }}</span>
      </div>

      <div v-if="props.user.fullName" class="data-item editable-item" data-field="fullName">
        <span class="data-label">Фамилия и Имя:</span>
        <template v-if="editing === 'fullName'">
          <input v-model="draft" class="data-value editable-field editing" />
          <button class="save-btn-field" :disabled="saving" @click="saveEdit('fullName')">
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
          <button class="cancel-btn-field" :disabled="saving" @click="cancelEdit">Отмена</button>
        </template>
        <template v-else>
          <span class="data-value">{{ props.user.fullName }}</span>
          <button class="edit-btn" @click="startEdit('fullName')">Редактировать</button>
        </template>
      </div>

      <div v-if="props.user.groupNumber" class="data-item editable-item" data-field="groupNumber">
        <span class="data-label">Номер группы:</span>
        <template v-if="editing === 'groupNumber'">
          <input v-model="draft" class="data-value editable-field editing" />
          <button class="save-btn-field" :disabled="saving" @click="saveEdit('groupNumber')">
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
          <button class="cancel-btn-field" :disabled="saving" @click="cancelEdit">Отмена</button>
        </template>
        <template v-else>
          <span class="data-value">{{ props.user.groupNumber }}</span>
          <button class="edit-btn" @click="startEdit('groupNumber')">Редактировать</button>
        </template>
      </div>
    </div>
  </div>
</template>
