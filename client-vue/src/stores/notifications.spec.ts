import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from './notifications'

describe('useNotificationStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('notify добавляет уведомление и возвращает id', () => {
    const store = useNotificationStore()
    const id = store.notify('Ошибка', 'danger', 0)
    expect(store.items).toHaveLength(1)
    expect(store.items[0]).toMatchObject({ id, message: 'Ошибка', type: 'danger' })
  })

  it('remove удаляет по id', () => {
    const store = useNotificationStore()
    const id = store.notify('x', 'info', 0)
    store.remove(id)
    expect(store.items).toHaveLength(0)
  })
})
