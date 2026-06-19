import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import PlaceholderView from '@/views/PlaceholderView.vue'
import LoginView from '@/views/LoginView.vue'
import { decideRedirect } from './guards'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Главная' } },
    { path: '/about', name: 'about', component: PlaceholderView, meta: { title: 'О проекте' } },
    { path: '/contacts', name: 'contacts', component: PlaceholderView, meta: { title: 'Контакты' } },
    {
      path: '/criteria',
      name: 'criteria',
      component: PlaceholderView,
      meta: { title: 'Оценочные критерии' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: PlaceholderView,
      meta: { title: 'Личный кабинет' },
    },
    {
      path: '/admin',
      name: 'admin',
      component: PlaceholderView,
      meta: { title: 'Кабинет администратора' },
    },
    {
      path: '/test-page',
      name: 'test-page',
      component: PlaceholderView,
      meta: { title: 'Тест' },
    },
    { path: '/topic', name: 'topic', component: PlaceholderView, meta: { title: 'Информация о теме' } },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: 'Вход', layout: 'bare' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { title: 'Страница не найдена' },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // /logout — служебный путь: выходим и идём на /login
  if (to.path === '/logout') {
    auth.logout()
    return '/login'
  }

  if (auth.isAuthenticated && !auth.user) {
    await auth.fetchCurrentUser()
  }

  const redirect = decideRedirect(to.path, auth.isAuthenticated, auth.user?.role)
  if (redirect && redirect !== to.path) return redirect
  return true
})

router.afterEach((to) => {
  const title = (to.meta.title as string) || 'Students Skill Tracker'
  document.title = title
})

export default router
