<script setup lang="ts">
import { onMounted, ref } from 'vue'
import confetti from 'canvas-confetti'

const props = defineProps<{
  answeredPercentage: number
  userScore: number
  userGrade: number
  testTopic: string
}>()

interface Bar {
  label: string
  value: number
  maxValue: number
  totalDivisions: number
  showPercentage: boolean
  display: string
  target: number
}

function makeBar(
  label: string,
  value: number,
  maxValue: number,
  totalDivisions: number,
  showPercentage = false,
): Bar {
  return {
    label,
    value,
    maxValue,
    totalDivisions,
    showPercentage,
    display: showPercentage ? `${Math.round(value)}%` : String(value),
    target: (value / maxValue) * 100,
  }
}

const bars = ref<Bar[]>([
  makeBar('Количество отвеченных вопросов', props.answeredPercentage, 100, 10, true),
  makeBar('Количество набранных баллов', props.userScore, 100, 10),
  makeBar('Ваша оценка', props.userGrade, 10, 10),
])

const widths = ref<number[]>([0, 0, 0])

function scaleLabels(totalDivisions: number, maxValue: number): number[] {
  return Array.from({ length: totalDivisions + 1 }, (_, i) =>
    Math.round((i * maxValue) / totalDivisions),
  )
}

function runConfetti(): void {
  const settings = {
    particleCount: 200,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#00ff00', '#0000ff', '#c0c0c0'],
    shapes: ['circle', 'square'] as ('circle' | 'square')[],
    scalar: 1.5,
  }
  for (let i = 0; i < 3; i++) setTimeout(() => confetti(settings), i * 500)
}

onMounted(() => {
  setTimeout(() => {
    bars.value.forEach((bar, index) => {
      setTimeout(() => {
        widths.value[index] = bar.target
      }, index * 1000)
    })
    if (props.userGrade > 5) setTimeout(runConfetti, bars.value.length * 1000 + 1000)
  }, 100)
})
</script>

<template>
  <div class="header-container">
    <h2>Итоги тестирования по теме: {{ props.testTopic }}</h2>
  </div>
  <div v-for="(bar, index) in bars" :key="index" class="progress-container">
    <p>
      {{ bar.label }}: <span class="value-label">{{ bar.display }}</span
      ><template v-if="!bar.showPercentage"> / {{ bar.maxValue }}</template>
    </p>
    <div class="scale-container">
      <span
        v-for="(label, li) in scaleLabels(bar.totalDivisions, bar.maxValue)"
        :key="li"
        class="scale-label"
        >{{ label }}</span
      >
    </div>
    <div class="progress-bar">
      <div
        class="progress-fill"
        :class="{ complete: widths[index] > 0 }"
        :style="{ width: `${widths[index]}%` }"
      ></div>
    </div>
  </div>
</template>
