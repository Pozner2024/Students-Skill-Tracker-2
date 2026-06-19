<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppMenu from '@/components/layout/AppMenu.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppLoader from '@/components/layout/AppLoader.vue'
</script>

<template>
  <div id="root">
    <AppHeader />
    <AppMenu />
    <RouterView />
    <AppFooter />
    <AppLoader />
  </div>
</template>
