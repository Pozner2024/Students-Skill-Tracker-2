<script setup lang="ts">
import { ref } from 'vue'
import { formatFileSize } from '@/utils/format'
import { formatDate } from '@/utils/adminFormat'
import { getStudentFileDownloadUrl, deleteStudentFile } from '@/api/admin'
import { getErrorMessage } from '@/api/errors'
import { useNotificationStore } from '@/stores/notifications'
import type { UserFile } from '@/api/types'

const props = defineProps<{ files: UserFile[]; studentId: number }>()
const emit = defineEmits<{ (e: 'deleted', key: string): void }>()

const notify = useNotificationStore()
const list = ref<UserFile[]>([...props.files])
const busy = ref<Record<string, boolean>>({})

function triggerDownload(href: string, fileName: string, revoke: boolean): void {
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  link.classList.add('hidden')
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    document.body.removeChild(link)
    if (revoke) URL.revokeObjectURL(href)
  }, 100)
}

async function download(file: UserFile): Promise<void> {
  busy.value[file.key] = true
  try {
    const result = await getStudentFileDownloadUrl(file.key)
    if (!result.success || !result.url) {
      notify.error(
        'Ошибка при получении ссылки на файл: ' + (result.error || 'Неизвестная ошибка'),
      )
      return
    }
    const fileName = file.fileName || file.key.split('/').pop() || 'download'
    try {
      const response = await fetch(result.url, { method: 'GET', mode: 'cors' })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const blob = await response.blob()
      triggerDownload(URL.createObjectURL(blob), fileName, true)
    } catch {
      triggerDownload(result.url, fileName, false)
    }
  } catch (error) {
    notify.error('Ошибка при скачивании файла: ' + getErrorMessage(error))
  } finally {
    busy.value[file.key] = false
  }
}

async function remove(file: UserFile): Promise<void> {
  if (!confirm('Вы уверены, что хотите удалить этот файл?')) return
  busy.value[file.key] = true
  try {
    const result = await deleteStudentFile(file.key)
    if (result.success) {
      list.value = list.value.filter((f) => f.key !== file.key)
      emit('deleted', file.key)
      notify.success('Файл успешно удален')
    } else {
      notify.error(result.error || 'Ошибка при удалении файла')
    }
  } catch (error) {
    notify.error('Ошибка при удалении файла: ' + getErrorMessage(error))
  } finally {
    busy.value[file.key] = false
  }
}
</script>

<template>
  <div class="student-files-section">
    <template v-if="!list || list.length === 0">
      <h4 class="files-section-title">Загруженные файлы</h4>
      <p class="no-files-message">Нет загруженных файлов</p>
    </template>
    <template v-else>
      <h4 class="files-section-title files-section-title-with-border">
        Загруженные файлы ({{ list.length }})
      </h4>
      <div class="files-list-admin">
        <div v-for="file in list" :key="file.key" class="file-item-admin" :data-key="file.key">
          <div class="file-info-admin">
            <span class="file-name-admin">{{ file.fileName }}</span>
            <span class="file-size-admin">{{ formatFileSize(file.size) }}</span>
            <span class="file-date-admin">{{ formatDate(file.lastModified, false) }}</span>
          </div>
          <div class="file-actions-admin">
            <button
              class="file-download-admin"
              :disabled="busy[file.key]"
              title="Скачать"
              @click="download(file)"
            >
              ⬇️ Скачать
            </button>
            <button
              type="button"
              class="file-delete-admin"
              :disabled="busy[file.key]"
              title="Удалить"
              @click="remove(file)"
            >
              🗑️ Удалить
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
