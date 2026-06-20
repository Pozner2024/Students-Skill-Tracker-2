<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getGroupedResults } from '@/api/admin'
import StudentAccordion from '@/components/admin/StudentAccordion.vue'
import type { AdminGroup, AdminStudent } from '@/api/types'

const groups = ref<AdminGroup[]>([])
const noGroup = ref<AdminStudent[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMessage = ref('')

async function load(): Promise<void> {
  status.value = 'loading'
  const result = await getGroupedResults()
  if (result.success) {
    groups.value = result.data.groups
    noGroup.value = result.data.noGroup
    status.value = 'ready'
  } else {
    errorMessage.value = result.error || 'Ошибка загрузки данных'
    status.value = 'error'
  }
}

function onDeletedUser(): void {
  // Как в старом клиенте: после удаления перезагружаем страницу через 1.5с.
  setTimeout(() => window.location.reload(), 1500)
}

onMounted(load)
</script>

<template>
  <main id="admin" class="container my-4">
    <h1>Кабинет преподавателя</h1>
    <section>
      <div class="test-results-section">
        <div v-if="status === 'loading'" class="admin-loading">Загрузка...</div>
        <div v-else-if="status === 'error'" class="no-results">
          <p>{{ errorMessage }}</p>
        </div>
        <template v-else>
          <template v-if="groups.length">
            <template v-for="group in groups" :key="group.groupNumber">
              <h3>Группа {{ group.groupNumber }}</h3>
              <div class="admin-accordion">
                <StudentAccordion
                  v-for="(student, i) in group.students"
                  :key="student.id"
                  :student="student"
                  :index="i"
                  @deleted-user="onDeletedUser"
                />
              </div>
            </template>
          </template>
          <p v-else>Нет данных по группам.</p>

          <hr />

          <template v-if="noGroup.length">
            <h3>Пользователи без указанной группы</h3>
            <div class="admin-accordion">
              <StudentAccordion
                v-for="(student, i) in noGroup"
                :key="student.id"
                :student="student"
                :index="i"
                @deleted-user="onDeletedUser"
              />
            </div>
          </template>
          <p v-else class="no-group-message">Нет пользователей без указанной группы.</p>
        </template>
      </div>
    </section>
  </main>
</template>
