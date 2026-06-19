import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from '@/router'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/assets/base.css'
import '@/assets/layout/header.css'
import '@/assets/layout/menu.css'
import '@/assets/layout/footer.css'
import '@/assets/layout/bootstrap-overrides.css'
import '@/assets/layout/cube-loader.css'
import '@/assets/pages/login.css'
import '@/assets/pages/about.css'
import '@/assets/pages/contacts.css'
import '@/assets/ui/modal.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
