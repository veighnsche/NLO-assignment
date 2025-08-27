import { useGridStore } from '@/frontend/features/game/store/grid'
import {
  apiAdminReset,
  apiAdminSetBotDelay,
  apiAdminGetBotDelay,
  apiAdminGetTargets,
  apiAdminSetCurrentPlayer,
  apiAdminPickRandomPlayer,
} from '@/frontend/features/admin/api'

export function useAdminControls() {
  const grid = useGridStore()

  async function reset(seed?: number): Promise<void> {
    await apiAdminReset('hard', seed)
    // Explicitly clear any active player on the server
    try {
      await apiAdminSetCurrentPlayer(null)
    } catch {
      // ignore in dev
    }
    // Clear any admin-exposed overlay so it doesn't show stale targets after reseed
    grid.clearExposedTargets(true)
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

  async function getBotDelay(): Promise<{ minMs: number; maxMs: number }> {
    return apiAdminGetBotDelay()
  }

  async function getTargets(): Promise<
    Array<{
      id: string
      row: number
      col: number
      prize: { type: 'consolation' | 'grand'; amount: 100 | 25000 }
    }>
  > {
    const res = await apiAdminGetTargets()
    return res.targets
  }

  async function pickRandomPlayer(): Promise<void> {
    try {
      const res = await apiAdminPickRandomPlayer()
      if ('ok' in res && res.ok) {
        await grid.refreshCurrentPlayer()
      }
    } catch {
      // ignore in dev
    }
  }

  return { reset, setBotSpeed, getBotDelay, getTargets, pickRandomPlayer }
}
