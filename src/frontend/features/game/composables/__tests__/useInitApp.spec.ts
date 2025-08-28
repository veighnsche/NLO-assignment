import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mocks for dependent stores
const sessionMock = {
  refreshCurrentPlayer: vi.fn().mockResolvedValue(undefined),
  ensureAssignedUser: vi.fn().mockResolvedValue(undefined),
  activePlayerId: null as string | null,
}
vi.mock('../../store/session', () => ({
  useSessionStore: () => sessionMock,
}))

const botMock = {
  startBotPolling: vi.fn(),
  stopBotPolling: vi.fn(),
}
vi.mock('../../store/bot', () => ({
  useBotStore: () => botMock,
}))

import { useInitApp } from '../useInitApp'

describe('useInitApp', () => {
  it('runs init on mount and stops polling on unmount', async () => {
    setActivePinia(createPinia())

    const gridMock = { boot: vi.fn().mockResolvedValue(undefined) }

    const Comp = defineComponent({
      name: 'Harness',
      setup() {
        const api = useInitApp(gridMock as any)
        return () => h('div', { id: 'app', 'data-init': String(api.isInitializing.value) })
      },
    })

    const wrapper = mount(Comp)

    // Initially initializing is true
    expect(wrapper.attributes('data-init')).toBe('true')

    // Wait a microtask flush for promises in init()
    await nextTick()
    await Promise.resolve()
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // Should flip to false after init completes
    expect(wrapper.attributes('data-init')).toBe('false')
    expect(gridMock.boot).toHaveBeenCalled()

    // Unmount triggers stopBotPolling
    wrapper.unmount()
    expect(botMock.stopBotPolling).toHaveBeenCalled()
  })
})
