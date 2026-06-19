<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useNotificationStore } from '@/stores/notifications'
import { validateLoginInput } from '@/api/validation'
import { getErrorMessage } from '@/api/errors'
import { hasValidToken } from '@/api/tokenStorage'
import SuccessModal from '@/components/ui/SuccessModal.vue'
import logo from '@/assets/logo_vgik.png'
import background from '@/assets/background.jpg'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const notify = useNotificationStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const showSuccess = ref(false)

function togglePassword(): void {
  showPassword.value = !showPassword.value
}

function goToApp(): void {
  showSuccess.value = false
  router.push('/')
}

async function handleLogin(): Promise<void> {
  const validationError = validateLoginInput(email.value, password.value)
  if (validationError) {
    notify.error(validationError)
    return
  }
  ui.showLoader()
  try {
    const result = await auth.login(email.value, password.value)
    if (result.success) {
      router.push('/')
    } else {
      notify.error(getErrorMessage(result, 'LoginView.handleLogin'))
    }
  } catch (error) {
    notify.error(getErrorMessage(error, 'LoginView.handleLogin'))
  } finally {
    ui.hideLoader()
  }
}

async function handleRegister(): Promise<void> {
  const validationError = validateLoginInput(email.value, password.value)
  if (validationError) {
    notify.error(validationError)
    return
  }
  ui.showLoader()
  try {
    const result = await auth.register(email.value, password.value)
    if (!result.success) {
      notify.error(getErrorMessage(result, 'LoginView.handleRegister'))
      return
    }
    if (!hasValidToken()) {
      const loginResult = await auth.login(email.value, password.value)
      if (!loginResult.success) {
        notify.error(getErrorMessage(loginResult, 'LoginView.handleRegister.login'))
        return
      }
    }
    if (!auth.isAuthenticated) {
      notify.error('Не удалось сохранить токен авторизации. Попробуйте войти вручную.')
      return
    }
    showSuccess.value = true
    setTimeout(goToApp, 800)
  } catch (error) {
    notify.error(getErrorMessage(error, 'LoginView.handleRegister'))
  } finally {
    ui.hideLoader()
  }
}
</script>

<template>
  <div
    class="page-background"
    :style="{
      backgroundImage: `url(${background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }"
  >
    <div class="main-container">
      <div class="text-section">
        <img :src="logo" alt="Логотип УО ВГИК" class="logo" />
        <h1 class="login-title">
          <span class="login-title-main">Кондитер-Pro</span>
        </h1>
        <p class="login-title-sub login-title-sub--primary">
          Контроль и оценка компетенций обучающихся по учебному предмету "Специальная технология"
        </p>
        <p class="login-title-sub login-title-sub--secondary">
          Специальность: "Обслуживание и изготовление продукции в общественном питании".
          Квалификация: "Кондитер 4 разряда"
        </p>
      </div>
      <div class="login-wrapper">
        <div class="form-box">
          <h2>Вход</h2>
          <form @submit.prevent>
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input
                v-model="email"
                type="email"
                class="form-control"
                id="email"
                placeholder="Введите Ваш email"
                required
              />
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Пароль</label>
              <div class="password-input-wrapper position-relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  id="password"
                  placeholder="******"
                  required
                />
                <button
                  type="button"
                  class="btn btn-link password-toggle-btn position-absolute top-50 end-0 translate-middle-y"
                  :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                  @click="togglePassword"
                >
                  <svg
                    v-if="!showPassword"
                    class="eye-icon eye-closed"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg
                    v-else
                    class="eye-icon eye-open"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>
            <button type="button" class="btn btn-primary w-100 mb-2" @click="handleLogin">
              Войти
            </button>
            <button type="button" class="btn btn-success w-100" @click="handleRegister">
              Зарегистрироваться
            </button>
          </form>
        </div>
      </div>
    </div>
    <SuccessModal
      v-if="showSuccess"
      title="Регистрация прошла успешно!"
      message="Сейчас вы будете перенаправлены в приложение"
      button-text="Перейти"
      @confirm="goToApp"
      @close="goToApp"
    />
  </div>
</template>
