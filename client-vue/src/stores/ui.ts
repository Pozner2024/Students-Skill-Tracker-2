import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isLoading = ref(false)
  function showLoader(): void {
    isLoading.value = true
  }
  function hideLoader(): void {
    isLoading.value = false
  }
  return { isLoading, showLoader, hideLoader }
})
