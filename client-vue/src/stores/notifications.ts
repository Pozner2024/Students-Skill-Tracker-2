import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'danger' | 'success' | 'warning' | 'info'

export interface Notification {
  id: number
  message: string
  type: NotificationType
}

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([])
  let nextId = 0

  function remove(id: number): void {
    items.value = items.value.filter((n) => n.id !== id)
  }

  function notify(message: string, type: NotificationType = 'danger', duration = 5000): number {
    const id = nextId++
    items.value.push({ id, message, type })
    if (duration > 0) setTimeout(() => remove(id), duration)
    return id
  }

  const error = (message: string, duration?: number) => notify(message, 'danger', duration)
  const success = (message: string, duration?: number) => notify(message, 'success', duration)
  const warning = (message: string, duration?: number) => notify(message, 'warning', duration)
  const info = (message: string, duration?: number) => notify(message, 'info', duration)

  return { items, notify, remove, error, success, warning, info }
})
