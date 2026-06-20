<script setup lang="ts">
import {
  getTestTitle,
  formatDate,
  formatTestSummary,
  getGradeForTest,
  formatValue,
} from '@/utils/adminFormat'
import type { AdminTest } from '@/api/types'

const props = defineProps<{ tests: AdminTest[] }>()

function titleWithVariant(test: AdminTest): string {
  const title = getTestTitle(test) || '-'
  const needVariant = typeof test.variant === 'number' && !/вариант/i.test(title)
  return `${title}${needVariant ? `, вариант ${test.variant}` : ''}`
}

function summaryWithGrade(test: AdminTest): string {
  const grade = getGradeForTest(test) ?? (typeof test.grade === 'number' ? test.grade : null)
  return `Итог: ${formatTestSummary(test)}${grade !== null ? `, Оценка: ${grade}` : ''}`
}
</script>

<template>
  <p v-if="!props.tests || props.tests.length === 0" class="no-tests-message">
    Нет пройденных тестов.
  </p>
  <div v-else class="student-tests-list">
    <div v-for="(test, i) in props.tests" :key="i" class="test-result-item">
      <div class="test-header">
        <div class="test-title">{{ titleWithVariant(test) }}</div>
        <div class="test-date">Дата: {{ formatDate(test.completed_at) }}</div>
      </div>
      <div class="test-details">
        <p v-if="!test.answers_details || test.answers_details.length === 0">-</p>
        <div v-else class="answers-details">
          <template v-for="(d, di) in test.answers_details" :key="di">
            <template v-if="di > 0"><br /><br /></template>
            Вопрос {{ d.questionNumber || '' }} ({{ d.type || '' }}):<br />
            Ответ пользователя: {{ formatValue(d.userAnswer) }}<br />
            Правильные ответы: {{ formatValue(d.correct) }}<br />
            Верно: {{ d.isCorrect ? 'true' : 'false' }}, Начисленные баллы: {{ d.score ?? 0 }}
          </template>
        </div>
        <div class="test-summary">{{ summaryWithGrade(test) }}</div>
      </div>
    </div>
  </div>
</template>
