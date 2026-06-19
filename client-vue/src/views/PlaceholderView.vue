<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <main class="container my-4">
    <h1>Страница «{{ String(route.name ?? route.path) }}» (заглушка)</h1>
    <p>Контент будет перенесён на следующих этапах миграции.</p>
  </main>
</template>
