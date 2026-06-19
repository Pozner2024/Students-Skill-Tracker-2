<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppMenu from '@/components/layout/AppMenu.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppLoader from '@/components/layout/AppLoader.vue'
import AppNotifications from '@/components/ui/AppNotifications.vue'

const route = useRoute()
const showChrome = computed(() => route.meta.layout !== 'bare')
</script>

<template>
  <div id="root">
    <AppHeader v-if="showChrome" />
    <AppMenu v-if="showChrome" />
    <RouterView />
    <AppFooter v-if="showChrome" />
    <AppLoader />
    <AppNotifications />
  </div>
</template>
