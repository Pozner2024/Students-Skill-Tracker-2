<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTest, getTestImages, saveTestResult } from '@/api/tests'
import { ScoreCalculator } from '@/utils/testScoring'
import type { TestData } from '@/api/types'
import background from '@/assets/background1.jpg'
import TestQuestionCard from '@/components/test/TestQuestionCard.vue'
import QuestionPagination from '@/components/test/QuestionPagination.vue'
import SkillProgressBar from '@/components/test/SkillProgressBar.vue'

const route = useRoute()
const test = ref<TestData | null>(null)
const topicName = ref('Тест')
const images = ref<Record<string, string>>({})
const status = ref<'loading' | 'ready' | 'empty'>('loading')

const currentIndex = ref(0)
const visited = reactive<Set<number>>(new Set([0]))
const answers = reactive<Record<number, unknown>>({})

const finished = ref(false)
const result = reactive({ answeredPercentage: 0, score: 0, grade: 0 })

const normalizedTitle = computed(() =>
  ((route.query.title as string) || topicName.value || 'Тест').replace(/^Тема:?\s*/i, ''),
)
const variant = computed(() => String(route.query.variant || '1'))
const total = computed(() => test.value?.questions.length || 0)
const currentQuestion = computed(() => test.value?.questions[currentIndex.value] || null)
const currentImage = computed(() => images.value[String(currentIndex.value + 1)] || null)
const visitedArr = computed(() => Array.from(visited))

function goTo(index: number): void {
  if (index < 0 || index >= total.value) return
  currentIndex.value = index
  visited.add(index)
}
function prev(): void {
  if (currentIndex.value > 0) goTo(currentIndex.value - 1)
}
function next(): void {
  if (currentIndex.value < total.value - 1) goTo(currentIndex.value + 1)
}

async function load(): Promise<void> {
  status.value = 'loading'
  const testCode = route.query.testCode as string | undefined
  const v = parseInt(variant.value, 10) || 1
  if (!testCode) {
    status.value = 'empty'
    return
  }
  const res = await getTest(testCode, v)
  if (!res.success || !res.data || !res.data.questions.length) {
    test.value = res.data
    status.value = 'empty'
    return
  }
  test.value = res.data
  topicName.value = res.topicName

  const match = testCode.match(/test(\d+)_/)
  const topicId = match ? parseInt(match[1], 10) : 1
  getTestImages(topicId, v, res.data.questions.length)
    .then((r) => {
      images.value = r.images
    })
    .catch(() => {})

  status.value = 'ready'
}

async function finish(): Promise<void> {
  if (!test.value) return
  const calc = new ScoreCalculator(test.value)
  const userAnswers = Array.from({ length: total.value }, (_, i) => answers[i])
  const totalScore = calc.calculateTotalScore(userAnswers)
  const answeredPercentage = calc.getAnsweredPercentage(userAnswers)
  const localMax = calc.getMaxScore()
  const localPercentage = localMax > 0 ? Math.round((totalScore / localMax) * 100) : 0

  const payloadGrade = calc.getGrade(localPercentage, total.value)
  const saved = await saveTestResult({
    testCode: test.value.testCode || 'unknown',
    variant: Number(test.value.variant) || 1,
    score: totalScore,
    totalQuestions: total.value,
    maxPoints: localMax,
    percentage: localPercentage,
    grade: payloadGrade,
    answersDetails: calc.lastDetails || [],
  })

  const maxPoints =
    saved && typeof saved.max_points === 'number' && saved.max_points > 0
      ? saved.max_points
      : localMax
  const scorePercentage = maxPoints > 0 ? Math.round((totalScore / maxPoints) * 100) : 0
  const grade =
    saved && typeof saved.grade === 'number'
      ? saved.grade
      : calc.getGrade(scorePercentage, total.value)

  result.answeredPercentage = answeredPercentage
  result.score = totalScore
  result.grade = grade
  finished.value = true
}

onMounted(load)
</script>

<template>
  <main id="test-page" class="container my-4">
    <SkillProgressBar
      v-if="finished"
      :answered-percentage="result.answeredPercentage"
      :user-score="result.score"
      :user-grade="result.grade"
      :test-topic="topicName"
    />

    <div
      v-else
      class="test-page-styles"
      :style="{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }"
    >
      <div class="test-info">
        <h2>
          {{ normalizedTitle }}: <span class="variant-text">Вариант {{ variant }}</span>
        </h2>
      </div>

      <div v-if="status === 'loading'" class="test-loading">Данные загружаются...</div>

      <template v-else-if="status === 'ready'">
        <div id="indicator-panel" class="indicator-panel">
          <QuestionPagination
            :total="total"
            :current="currentIndex"
            :visited="visitedArr"
            @select="goTo"
          />
          <button id="finishButton" class="nav-button finish-button" @click="finish">
            Результаты
          </button>
        </div>

        <div id="questions-panel" class="questions-panel">
          <h3>Вопрос {{ currentIndex + 1 }} из {{ total }}</h3>
          <TestQuestionCard
            v-if="currentQuestion"
            :key="currentIndex"
            :question="currentQuestion"
            :index="currentIndex"
            :total="total"
            :image-path="currentImage"
            :model-value="answers[currentIndex]"
            @update:model-value="answers[currentIndex] = $event"
            @prev="prev"
            @next="next"
          />
        </div>
        <div class="navigation-panel"></div>
      </template>

      <p v-else class="error-note">Не удалось загрузить тест.</p>
    </div>
  </main>
</template>
