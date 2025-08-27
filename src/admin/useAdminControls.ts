import { useGridStore } from '@/frontend/store/grid'
import { apiAdminReset, apiAdminSetBotDelay } from '@/frontend/api'

export function useAdminControls() {
  const grid = useGridStore()

  async function reset(seed?: number): Promise<void> {
    await apiAdminReset('hard', seed)
    // Allow the current browser to reveal again after a reset
    localStorage.removeItem('nlo-user-revealed')
    await grid.refresh()
  }

  async function setBotSpeed(payload: {
    intervalMs: number
    minMs: number
    maxMs: number
  }): Promise<void> {
    try {
      await apiAdminSetBotDelay(payload.minMs, payload.maxMs)
    } catch {
      // ignore in dev
    }
    grid.stopBotPolling()
    grid.startBotPolling(payload.intervalMs)
  }

  return { reset, setBotSpeed }
}
