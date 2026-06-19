<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCurrentUser, getTestResults } from '@/api/users'
import type { TestResultsResult, User } from '@/api/types'
import ProfileSetupForm from '@/components/profile/ProfileSetupForm.vue'
import UserDataSection from '@/components/profile/UserDataSection.vue'
import FilesSection from '@/components/profile/FilesSection.vue'
import TestResultsSection from '@/components/profile/TestResultsSection.vue'

const title = 'Добро пожаловать в Ваш личный кабинет'
const user = ref<User | null>(null)
const results = ref<TestResultsResult>({ success: true, results: [] })
const loadError = ref('')

const hasUserData = computed(() => !!(user.value?.fullName && user.value?.groupNumber))

async function loadUser(): Promise<void> {
  const result = await getCurrentUser()
  if (result.success && result.user) {
    user.value = result.user
    loadError.value = ''
  } else {
    loadError.value = result.error || 'Не удалось загрузить информацию о пользователе'
  }
}

onMounted(async () => {
  await loadUser()
  results.value = await getTestResults()
})
</script>

<template>
  <main id="profile" class="container my-4 profile">
    <h1>{{ title }}</h1>
    <section>
      <div class="profile-container">
        <div v-if="loadError" class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Ошибка загрузки данных</h4>
          <p>Не удалось загрузить информацию о пользователе: {{ loadError }}</p>
        </div>
        <template v-else-if="user">
          <ProfileSetupForm v-if="!hasUserData" @saved="loadUser" />
          <UserDataSection :user="user" @updated="loadUser" />
          <FilesSection />
          <TestResultsSection :results="results" />
        </template>
      </div>
    </section>
  </main>
</template>
