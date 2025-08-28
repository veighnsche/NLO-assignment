import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// We'll dynamically import the module under test so its internal module state resets per test
async function importConnectivity() {
  const mod = await import('../connectivity')
  return mod
}

// Hold a shared mock for the status store so we can assert calls
const statusMock = { setNetworkOk: vi.fn<(ok: boolean) => void>() }

vi.mock('@/frontend/features/game/store/status', () => ({
  useStatusStore: () => statusMock,
}))

const originalNavigator = globalThis.navigator

function setNavigatorOnlineState(online: boolean) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { ...originalNavigator, onLine: online },
    configurable: true,
  })
}

let lastCleanup: (() => void) | undefined

beforeEach(() => {
  statusMock.setNetworkOk.mockClear()
  // Default to online
  setNavigatorOnlineState(true)
})

afterEach(() => {
  // Ensure any prior setupConnectivity listeners are removed
  if (lastCleanup) {
    try {
      lastCleanup()
    } finally {
      lastCleanup = undefined
    }
  }
  Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true })
  vi.resetModules()
  vi.restoreAllMocks()
})

describe('setupConnectivity', () => {
  it('initializes from navigator.onLine and updates store', async () => {
    setNavigatorOnlineState(true)
    const { setupConnectivity } = await importConnectivity()
    const cleanup = setupConnectivity()
    lastCleanup = cleanup || undefined

    expect(statusMock.setNetworkOk).toHaveBeenCalledWith(true)

    // Simulate offline then online
    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('online'))

    expect(statusMock.setNetworkOk).toHaveBeenCalledWith(false)
    expect(statusMock.setNetworkOk).toHaveBeenCalledWith(true)

    cleanup?.()
    lastCleanup = undefined
  })

  it('cleanup removes listeners (no further updates after cleanup)', async () => {
    const { setupConnectivity } = await importConnectivity()
    const cleanup = setupConnectivity()
    lastCleanup = cleanup || undefined

    statusMock.setNetworkOk.mockClear()

    cleanup?.()
    lastCleanup = undefined

    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('online'))

    expect(statusMock.setNetworkOk).not.toHaveBeenCalled()
  })
})

