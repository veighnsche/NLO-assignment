import 'fake-indexeddb/auto'
import { beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { server } from '@/backend/msw/server'
import { createPinia, setActivePinia } from 'pinia'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))

afterEach(() => server.resetHandlers())

// Ensure an active Pinia is available for any component or composable that uses stores
beforeEach(() => {
  setActivePinia(createPinia())
})

afterAll(() => server.close())
