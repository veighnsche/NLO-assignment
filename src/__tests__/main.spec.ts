import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Create #app mount point
beforeEach(() => {
  const el = document.createElement('div')
  el.id = 'app'
  document.body.appendChild(el)
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.resetModules()
  vi.restoreAllMocks()
})

// Mocks
vi.mock('vue', async (importOriginal) => {
  const actual: any = await importOriginal()
  const app = {
    use: vi.fn().mockReturnThis(),
    mount: vi.fn(),
  }
  return {
    ...actual,
    createApp: vi.fn(() => app),
  }
})

vi.mock('pinia', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    createPinia: vi.fn(() => ({ __pinia: true })),
    setActivePinia: vi.fn(),
  }
})

vi.mock('@/frontend/lib/connectivity', () => ({
  setupConnectivity: vi.fn(() => undefined),
}))

// Stub the root App to avoid deep component imports
vi.mock('@/frontend/App.vue', () => ({
  default: { name: 'App', template: '<div />' },
}))

// Mock MSW dynamic import
vi.mock('@/backend/msw/browser', () => ({
  worker: { start: vi.fn(async () => undefined) },
}))

// Force DEV true to exercise prepareMocks path
Object.defineProperty(import.meta, 'env', {
  value: { ...import.meta.env, DEV: true },
})

describe('main bootstrap', () => {
  it('creates app, installs pinia, sets active pinia, sets up connectivity and mounts', async () => {
    await import('@/main')

    const { createApp } = (await import('vue')) as any
    const { createPinia, setActivePinia } = (await import('pinia')) as any
    const { setupConnectivity } = (await import('@/frontend/lib/connectivity')) as any
    const msw = (await import('@/backend/msw/browser')) as any

    expect(createApp).toHaveBeenCalled()
    expect(createPinia).toHaveBeenCalled()
    expect(setActivePinia).toHaveBeenCalled()
    expect(setupConnectivity).toHaveBeenCalled()
    expect(msw.worker.start).toHaveBeenCalled()

    const appInstance = (createApp as any).mock.results[0].value
    expect(appInstance.use).toHaveBeenCalled()
    expect(appInstance.mount).toHaveBeenCalledWith('#app')
  })
})
