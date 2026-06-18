import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Заглушка: реальная логика входа/выхода и загрузки пользователя — на Этапе 1.
export const useAuthStore = defineStore('auth', () => {
  const user = ref<unknown | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  return { user, token, isAuthenticated }
})
