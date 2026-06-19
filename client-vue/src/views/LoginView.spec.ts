import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from './LoginView.vue'
import { useNotificationStore } from '@/stores/notifications'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('при пустых полях показывает уведомление об ошибке и не уходит со страницы', async () => {
    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    await wrapper.get('button.btn-primary').trigger('click')
    const notify = useNotificationStore()
    expect(notify.items.length).toBeGreaterThan(0)
    expect(notify.items[0].message).toMatch(/email/i)
  })
})
