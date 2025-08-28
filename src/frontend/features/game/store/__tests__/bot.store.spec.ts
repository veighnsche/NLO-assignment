import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.useFakeTimers()

vi.mock('../../api', () => ({
  apiBotStep: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock('../status', () => {
  const setNetworkOk = vi.fn()
  return {
    useStatusStore: vi.fn(() => ({ setNetworkOk })),
    __mocks: { setNetworkOk },
  }
})

vi.mock('../grid', () => {
  const refresh = vi.fn().mockResolvedValue(undefined)
  return {
    useGridStore: vi.fn(() => ({ refresh })),
    __mocks: { refresh },
  }
})

import { useBotStore } from '../bot'
import { apiBotStep } from '../../api'

// Access mocks for assertions
const statusModule = (await import('../status')) as any
const gridModule = (await import('../grid')) as any

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

afterEach(() => {
  // Stop any running polling interval
  try {
    const s = useBotStore()
    s.stopBotPolling()
  } catch {}
  vi.clearAllTimers()
  vi.clearAllMocks()
})

describe('useBotStore', () => {
  it('startBotPolling starts interval and performs step/refresh', async () => {
    const s = useBotStore()
    s.startBotPolling(200)

    // Calling again should be a no-op (no duplicate intervals)
    s.startBotPolling(200)

    await vi.advanceTimersByTimeAsync(210)

    expect(apiBotStep).toHaveBeenCalledTimes(1)
    expect(statusModule.__mocks.setNetworkOk).toHaveBeenCalledWith(true)
    expect(gridModule.__mocks.refresh).toHaveBeenCalledTimes(1)
  })

  it('stopBotPolling clears interval and prevents further calls', async () => {
    const s = useBotStore()
    s.startBotPolling(100)
    await vi.advanceTimersByTimeAsync(110)
    expect(apiBotStep).toHaveBeenCalledTimes(1)

    s.stopBotPolling()
    await vi.advanceTimersByTimeAsync(500)
    // Still only the first tick
    expect(apiBotStep).toHaveBeenCalledTimes(1)
  })

  it('setPollingInterval restarts when active', async () => {
    const s = useBotStore()
    s.startBotPolling(300)
    await vi.advanceTimersByTimeAsync(310)
    expect(apiBotStep).toHaveBeenCalledTimes(1)

    s.setPollingInterval(50)
    await vi.advanceTimersByTimeAsync(60)
    expect(apiBotStep).toHaveBeenCalledTimes(2)
  })

  it('handles apiBotStep failure by marking network not ok', async () => {
    ;(apiBotStep as any).mockRejectedValueOnce(new Error('net'))
    const s = useBotStore()
    s.startBotPolling(10)
    await vi.advanceTimersByTimeAsync(15)
    expect(statusModule.__mocks.setNetworkOk).toHaveBeenCalledWith(false)
  })
})
