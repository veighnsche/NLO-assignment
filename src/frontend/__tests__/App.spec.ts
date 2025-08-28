import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import App from '@/frontend/App.vue'

// Mock grid store usage inside App.vue
vi.mock('@/frontend/features/game/store/grid', () => ({
  useGridStore: () => ({}) as any,
}))

// Hoisted refs to control isInitializing between tests
const initRef = ref(true)
vi.mock('@/frontend/features/game/composables/useInitApp', () => ({
  useInitApp: () => ({ isInitializing: initRef }),
}))

// Keep DOM simple by stubbing imported child components
const globalStubs = {
  AdminBar: true,
  TopBar: true,
  Header: true,
  Footer: true,
  GameSection: true,
  InitScreen: true,
}

describe('App.vue', () => {
  beforeEach(() => {
    initRef.value = true
  })

  it('renders InitScreen while initializing', () => {
    const w = mount(App, { global: { stubs: globalStubs } })
    expect(w.find('init-screen-stub').exists()).toBe(true)
    expect(w.find('header-stub').exists()).toBe(false)
    expect(w.find('game-section-stub').exists()).toBe(false)
  })

  it('renders main content when initialized', async () => {
    initRef.value = false
    const w = mount(App, { global: { stubs: globalStubs } })
    expect(w.find('top-bar-stub').exists()).toBe(true)
    expect(w.find('header-stub').exists()).toBe(true)
    expect(w.find('game-section-stub').exists()).toBe(true)
    expect(w.find('footer-stub').exists()).toBe(true)
    // Admin bar shown by default
    expect(w.find('admin-bar-stub').exists()).toBe(true)
  })
})
