import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import App from './frontend/App.vue'
import './frontend/styles/index.css'
import { setupConnectivity } from './frontend/lib/connectivity'

async function prepareMocks() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./backend/msw/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

async function bootstrap() {
  await prepareMocks()
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  // Ensure Pinia is active for composables used outside components
  setActivePinia(pinia)
  // Initialize connectivity monitoring (updates status store and auto-reloads on reconnect)
  setupConnectivity({ autoReloadOnReconnect: true })
  app.mount('#app')
}

void bootstrap()
