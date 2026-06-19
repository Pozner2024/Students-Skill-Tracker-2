<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import logo from '@/assets/logo_vgik.png'

interface MenuItem {
  title: string
  url: string
}

const MENU_ITEMS: MenuItem[] = [
  { title: 'Главная', url: '/' },
  { title: 'Оценочные критерии', url: '/criteria' },
  { title: 'Личный кабинет', url: '/profile' },
  { title: 'О проекте', url: '/about' },
  { title: 'Контакты', url: '/contacts' },
  { title: 'Выход', url: '/logout' },
]

const router = useRouter()
const auth = useAuthStore()
const isOpen = ref(false)

function isMobile(): boolean {
  return window.innerWidth <= 991
}

function openMenu(): void {
  isOpen.value = true
}

function closeMenu(): void {
  if (isMobile()) isOpen.value = false
}

async function handleItemClick(item: MenuItem): Promise<void> {
  closeMenu()
  if (item.url === '/logout') {
    auth.logout()
    await router.push('/login')
    return
  }
  await router.push(item.url)
}

function handleEscape(event: KeyboardEvent): void {
  if ((event.key === 'Escape' || event.key === 'Esc') && isOpen.value && isMobile()) {
    closeMenu()
  }
}

function handleResize(): void {
  if (!isMobile()) isOpen.value = false
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <section id="menu" class="menu site-menu">
    <nav class="navbar navbar-expand-lg" aria-label="Главная навигация">
      <div class="container-fluid">
        <RouterLink
          to="/"
          class="menu-logo-link text-decoration-none"
          aria-label="На главную"
          @click="closeMenu"
        >
          <img :src="logo" alt="Логотип" class="menu-logo img-fluid" />
        </RouterLink>

        <button
          class="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          :aria-expanded="isOpen"
          aria-label="Открыть меню"
          @click="openMenu"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" :class="{ show: isOpen }" id="navbarNav">
          <button
            class="navbar-close-btn"
            type="button"
            aria-label="Закрыть меню"
            @click="isOpen = false"
          >
            <span class="navbar-close-icon">×</span>
          </button>

          <ul class="navbar-nav mx-auto">
            <li class="nav-item menu-mobile-title">
              <span class="nav-link menu-link menu-mobile-title-text">Меню</span>
            </li>
            <li v-for="item in MENU_ITEMS" :key="item.url" class="nav-item">
              <a :href="item.url" class="nav-link menu-link" @click.prevent="handleItemClick(item)">{{
                item.title
              }}</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </section>
</template>
