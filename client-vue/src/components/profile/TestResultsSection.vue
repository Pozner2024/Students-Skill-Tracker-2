<script setup lang="ts">
import type { TestResult, TestResultsResult } from '@/api/types'

const props = defineProps<{ results: TestResultsResult }>()

function testTitle(t: TestResult): string {
  return t.test_title || t.test_code || ''
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU')
}
</script>

<template>
  <div class="test-results-section">
    <h3>Ваши результаты</h3>
    <div v-if="!props.results.success" class="alert alert-warning" role="alert">
      Ошибка загрузки результатов: {{ props.results.error }}
    </div>
    <div v-else-if="props.results.results.length === 0" class="alert alert-info" role="alert">
      Нет пройденных тестов
    </div>
    <div v-else class="test-results-list">
      <div v-for="(result, i) in props.results.results" :key="i" class="test-result-item">
        <div class="result-header">
          <span class="test-title">Вы прошли тест {{ testTitle(result) }}</span>
          <span class="test-date">{{ formatDate(result.completed_at) }}</span>
        </div>
        <div class="result-score">
          <span class="score">Оценка: {{ result.grade ?? '-' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
