<script setup lang="ts">
import { ref } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { validateGroupNumber } from '@/api/validation'
import { updateProfile } from '@/api/users'
import { getErrorMessage } from '@/api/errors'

const emit = defineEmits<{ (e: 'saved'): void }>()
const notify = useNotificationStore()

const fullName = ref('')
const groupNumber = ref('')
const saving = ref(false)

async function onSubmit(): Promise<void> {
  const name = fullName.value.trim()
  const group = groupNumber.value.trim()
  const groupError = validateGroupNumber(group)
  if (groupError) {
    notify.warning(groupError)
    return
  }
  saving.value = true
  try {
    const result = await updateProfile(name, group)
    if (result.success) {
      notify.success('Данные успешно сохранены!')
      emit('saved')
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
  <form class="profile-form" @submit.prevent="onSubmit">
    <div class="row g-3">
      <div class="col-md-8 col-lg-8">
        <label for="fullName" class="form-label">Фамилия и Имя:</label>
        <input
          v-model="fullName"
          type="text"
          class="form-control"
          id="fullName"
          name="fullName"
          placeholder="Введите ваши фамилию и имя"
        />
      </div>
      <div class="col-md-4 col-lg-4">
        <label for="groupNumber" class="form-label">Номер группы:</label>
        <input
          v-model="groupNumber"
          type="text"
          class="form-control"
          id="groupNumber"
          name="groupNumber"
          placeholder="Введите номер группы"
        />
      </div>
    </div>
    <div class="mt-3 text-center">
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </div>
  </form>
</template>
