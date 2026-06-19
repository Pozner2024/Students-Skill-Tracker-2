<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>

<template>
  <div v-show="ui.isLoading" class="cube-loader-container">
    <div class="content">
      <div class="cube"></div>
    </div>
  </div>
</template>
