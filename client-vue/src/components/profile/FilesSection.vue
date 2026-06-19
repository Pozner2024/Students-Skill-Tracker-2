<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { getUserFiles, uploadFile, deleteFile, getDownloadUrl } from '@/api/users'
import { getErrorMessage } from '@/api/errors'
import { formatFileSize } from '@/utils/format'
import type { UserFile } from '@/api/types'

const notify = useNotificationStore()
const files = ref<UserFile[]>([])
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

async function loadFiles(): Promise<void> {
  const result = await getUserFiles()
  files.value = result.success ? result.files : []
}

onMounted(loadFiles)

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU')
}

async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const result = await uploadFile(file)
    if (result.success) {
      notify.success('Файл успешно загружен!')
      await loadFiles()
    } else {
      notify.error('Ошибка при загрузке файла: ' + (result.error || 'Неизвестная ошибка'))
    }
  } catch (error) {
    notify.error('Ошибка при загрузке файла: ' + getErrorMessage(error))
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

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

async function onDownload(file: UserFile): Promise<void> {
  try {
    const result = await getDownloadUrl(file.key)
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
  }
}

async function onDelete(file: UserFile): Promise<void> {
  if (!confirm('Вы уверены, что хотите удалить этот файл?')) return
  try {
    const result = await deleteFile(file.key)
    if (result.success) {
      notify.success('Файл успешно удален!')
      await loadFiles()
    } else {
      notify.error('Ошибка при удалении файла: ' + (result.error || 'Неизвестная ошибка'))
    }
  } catch (error) {
    notify.error('Ошибка при удалении файла: ' + getErrorMessage(error))
  }
}
</script>

<template>
  <div class="files-section">
    <h3>Мои файлы</h3>
    <div class="upload-area">
      <input
        ref="fileInput"
        type="file"
        id="file-input"
        class="file-input"
        accept="image/*,application/pdf,.doc,.docx,.txt,.docs,.xls,.xlsx,.ppt,.pptx"
        @change="onFileChange"
      />
      <label for="file-input" class="upload-btn" :class="{ disabled: uploading }">
        <span class="upload-icon">📁</span>
        <span class="upload-text">{{
          uploading ? 'Загрузка...' : 'Выберите файл для загрузки'
        }}</span>
      </label>
      <div class="upload-info">
        <small
          >Максимальный размер: 10 MB. Разрешенные форматы: изображения, PDF, документы Word (.doc,
          .docx, .docs), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), текстовые файлы
          (.txt)</small
        >
      </div>
    </div>

    <div v-if="files.length === 0" class="files-list empty">
      <p>Нет загруженных файлов</p>
    </div>
    <div v-else class="files-list">
      <div v-for="file in files" :key="file.key" class="file-item" :data-key="file.key">
        <div class="file-info">
          <span class="file-name">{{ file.fileName }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
          <span class="file-date">{{ formatDate(file.lastModified) }}</span>
        </div>
        <div class="file-actions">
          <a href="#" class="file-download" title="Скачать" @click.prevent="onDownload(file)">⬇️</a>
          <button type="button" class="file-delete" title="Удалить" @click="onDelete(file)">
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
