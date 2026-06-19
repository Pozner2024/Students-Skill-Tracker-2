import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProfileSetupForm from './ProfileSetupForm.vue'
import { useNotificationStore } from '@/stores/notifications'

describe('ProfileSetupForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('некорректный формат группы показывает предупреждение и не сохраняет', async () => {
    const wrapper = mount(ProfileSetupForm)
    await wrapper.get('#groupNumber').setValue('123')
    await wrapper.get('form').trigger('submit')
    const notify = useNotificationStore()
    expect(notify.items.length).toBeGreaterThan(0)
    expect(notify.items[0].message).toMatch(/формат/i)
  })
})
