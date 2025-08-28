import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './frontend/App.vue'
import './frontend/styles/index.css'

async function prepareMocks() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./backend/msw/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

async function bootstrap() {
  await prepareMocks()
  const app = createApp(App)
  app.use(createPinia())
  app.mount('#app')
}

void bootstrap()
