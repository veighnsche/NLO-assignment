import { defineStore } from 'pinia'
import {
  apiBoot,
  apiSnapshot,
  apiReveal,
  apiBotStep,
  apiAdminGetTargets,
} from '@/frontend/shared/api/client'

// Strong type for revealed cell entries
export interface RevealedCellEntry {
  id: string
  row: number
  col: number
  revealed: boolean
  prize?: { type: 'none' | 'consolation' | 'grand'; amount: 0 | 100 | 25000 }
  revealedBy?: string
  revealedAt?: string
}

export const useGridStore = defineStore('grid', {
  state: () => ({
    meta: null as null | {
      version: number
      etag: string
    },
    lastEtag: null as string | null,
    revealed: [] as Array<RevealedCellEntry>,
    openedCount: 0,
    total: 0,
    consolationTotal: 100,
    isBooting: false,
    isRefreshing: false,
    isRevealing: false,
    botTimerId: null as number | null,
    // Network/Backend status
    networkOk: true,
    // Admin-only exposure of hidden target cells
    showExposed: false,
    targetsEtag: null as string | null,
    exposedTargets: [] as Array<{
      id: string
      row: number
      col: number
      prize: { type: 'consolation' | 'grand'; amount: 100 | 25000 }
    }>,
    // Stable id Sets to avoid recomputing per render
    revealedIds: new Set<string>() as Set<string>,
    exposedIds: new Set<string>() as Set<string>,
    // Stable Map for id -> revealed entry
    revealedByIdMap: new Map<string, RevealedCellEntry>() as Map<
      string,
      RevealedCellEntry
    >,
  }),

  getters: {
    revealedSet(state): Set<string> {
      // Return stable Set to avoid re-allocation per access
      return state.revealedIds
    },
    exposedSet(state): Set<string> {
      return state.exposedIds
    },
    revealedById(state): Map<string, RevealedCellEntry> {
      // Return stable Map
      return state.revealedByIdMap as Map<string, RevealedCellEntry>
    },
  },

  actions: {
    getPlayerId(): string {
      // Stable client id used only for attribution; backend enforces one-open rule
      const key = 'nlo-player-id'
      try {
        const existing = localStorage.getItem(key)
        if (existing) return existing
        const rnd = crypto.getRandomValues(new Uint32Array(4))
        const pid = Array.from(rnd)
          .map((n) => n.toString(16).padStart(8, '0'))
          .join('')
        localStorage.setItem(key, pid)
        return pid
      } catch {
        return `anon-${Math.random().toString(36).slice(2)}`
      }
    },
    async boot(seed?: number) {
      this.isBooting = true
      try {
        await apiBoot(seed)
        this.networkOk = true
        await this.refresh()
      } finally {
        this.isBooting = false
      }
    },

    async refresh() {
      this.isRefreshing = true
      try {
        const snap = await apiSnapshot()
        this.networkOk = true
        const prevEtag = this.lastEtag
        // If nothing changed on the backend, avoid touching reactive state to prevent giant rerenders
        if (prevEtag === snap.meta.etag) {
          // Keep meta in sync for consumers that read it, but do not assign arrays
          this.meta = snap.meta
          return
        }
        // Apply updated snapshot only when etag changes
        this.meta = snap.meta
        this.revealed = snap.revealed
        // Mutate stable revealedIds Set and revealedByIdMap in place
        this.revealedIds.clear()
        this.revealedByIdMap.clear()
        for (const c of snap.revealed) {
          this.revealedIds.add(c.id)
          this.revealedByIdMap.set(c.id, c)
        }
        this.openedCount = snap.openedCount
        this.total = snap.total
        this.lastEtag = snap.meta.etag
      } catch {
        this.networkOk = false
      } finally {
        this.isRefreshing = false
      }
    },

    userHasRevealed(): boolean {
      const pid = this.getPlayerId()
      return this.revealed.some((c) => c.revealedBy === pid)
    },

    // Kept for compatibility; no longer used to set truth
    markUserRevealed() {
      /* no-op: backend/state is source of truth */
    },

    async reveal(id: string, playerId?: string) {
      if (this.isRevealing) return
      if (this.userHasRevealed()) return
      this.isRevealing = true
      try {
        // Ensure a stable playerId is used for attribution
        const pid = playerId || this.getPlayerId()
        await apiReveal(id, pid)
        this.networkOk = true
        await this.refresh()
      } catch (err) {
        this.networkOk = false
        throw err
      } finally {
        this.isRevealing = false
      }
    },

    startBotPolling(intervalMs = 1500) {
      if (this.botTimerId != null) return
      const handle = window.setInterval(async () => {
        try {
          await apiBotStep()
          this.networkOk = true
          await this.refresh()
        } catch {
          this.networkOk = false
          // ignore in dev
        }
      }, intervalMs)
      this.botTimerId = handle
    },

    stopBotPolling() {
      if (this.botTimerId != null) {
        clearInterval(this.botTimerId)
        this.botTimerId = null
      }
    },

    // --- Admin-only helpers ---
    async loadExposedTargets() {
      try {
        const currentEtag = this.meta?.etag ?? null
        if (this.targetsEtag && currentEtag && this.targetsEtag === currentEtag) {
          // Already loaded for this grid state; skip
          return
        }
        const res = await apiAdminGetTargets()
        this.exposedTargets = res.targets
        // Update exposedIds Set in place for stability
        this.exposedIds.clear()
        for (const t of res.targets) this.exposedIds.add(t.id)
        this.targetsEtag = currentEtag
        this.networkOk = true
      } catch {
        this.networkOk = false
        // ignore in dev
      }
    },
    toggleExposed(force?: boolean) {
      if (typeof force === 'boolean') {
        this.showExposed = force
      } else {
        this.showExposed = !this.showExposed
      }
      // Lazy-load when enabling
      if (this.showExposed && this.exposedTargets.length === 0) {
        void this.loadExposedTargets()
      }
    },

    clearExposedTargets(hide = true) {
      this.exposedTargets = []
      this.targetsEtag = null
      this.exposedIds.clear()
      if (hide) this.showExposed = false
    },
  },
})
