import { useGridStore } from '@/frontend/features/game/store/grid'
import { useExposedStore } from '@/frontend/features/admin/store/exposed'
import { useBotStore } from '@/frontend/features/game/store/bot'
import { useSessionStore } from '@/frontend/features/game/store/session'
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
  const exposed = useExposedStore()
  const bot = useBotStore()
  const session = useSessionStore()

  async function reset(seed?: number): Promise<void> {
    await apiAdminReset(seed)
    // Explicitly clear any active player on the server (best-effort)
    try {
      await apiAdminSetCurrentPlayer(null)
    } catch {
      // ignore optional failure; not critical for reset completion
    }
    // Clear any admin-exposed overlay so it doesn't show stale targets after reseed
    exposed.clearTargets()
    await grid.refresh()
  }

  async function setBotSpeed(payload: {
    intervalMs: number
    minMs: number
    maxMs: number
  }): Promise<void> {
    await apiAdminSetBotDelay(payload.minMs, payload.maxMs)
    bot.setPollingInterval(payload.intervalMs)
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
    const res = await apiAdminPickRandomPlayer()
    if ('ok' in res && res.ok) {
      await session.refreshCurrentPlayer()
    } else {
      throw new Error('Kon geen speler kiezen')
    }
  }

  return { reset, setBotSpeed, getBotDelay, getTargets, pickRandomPlayer }
}
