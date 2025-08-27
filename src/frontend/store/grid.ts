import { defineStore } from 'pinia'
import { apiBoot, apiSnapshot, apiReveal, apiBotStep, apiAdminGetTargets } from '@/frontend/api'

export const useGridStore = defineStore('grid', {
  state: () => ({
    meta: null as null | {
      version: number
      etag: string
    },
    lastEtag: null as string | null,
    revealed: [] as Array<{
      id: string
      row: number
      col: number
      revealed: boolean
      prize?: { type: 'none' | 'consolation' | 'grand'; amount: 0 | 100 | 25000 }
      revealedBy?: string
      revealedAt?: string
    }>,
    openedCount: 0,
    total: 0,
    consolationTotal: 100,
    isBooting: false,
    isRefreshing: false,
    isRevealing: false,
    botTimerId: null as number | null,
    // Admin-only exposure of hidden target cells
    showExposed: false,
    targetsEtag: null as string | null,
    exposedTargets: [] as Array<{
      id: string
      row: number
      col: number
      prize: { type: 'consolation' | 'grand'; amount: 100 | 25000 }
    }>,
  }),

  getters: {
    revealedSet(state): Set<string> {
      return new Set(state.revealed.map((c) => c.id))
    },
    exposedSet(state): Set<string> {
      return new Set(state.exposedTargets.map((t) => t.id))
    },
  },

  actions: {
    async boot(seed?: number) {
      this.isBooting = true
      try {
        await apiBoot(seed)
        await this.refresh()
      } finally {
        this.isBooting = false
      }
    },

    async refresh() {
      this.isRefreshing = true
      try {
        const snap = await apiSnapshot()
        const prevEtag = this.lastEtag
        this.meta = snap.meta
        this.revealed = snap.revealed
        this.openedCount = snap.openedCount
        this.total = snap.total
        // Only record etag; do not clear exposed targets here to avoid flicker on bot reveals.
        if (prevEtag !== snap.meta.etag) {
          this.lastEtag = snap.meta.etag
        }
      } finally {
        this.isRefreshing = false
      }
    },

    userHasRevealed(): boolean {
      return localStorage.getItem('nlo-user-revealed') === '1'
    },

    markUserRevealed() {
      localStorage.setItem('nlo-user-revealed', '1')
    },

    async reveal(id: string, playerId?: string) {
      if (this.isRevealing) return
      if (this.userHasRevealed()) return
      this.isRevealing = true
      try {
        await apiReveal(id, playerId)
        this.markUserRevealed()
        await this.refresh()
      } finally {
        this.isRevealing = false
      }
    },

    startBotPolling(intervalMs = 1500) {
      if (this.botTimerId != null) return
      const handle = window.setInterval(async () => {
        try {
          await apiBotStep()
          await this.refresh()
        } catch {
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
        this.targetsEtag = currentEtag
      } catch {
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
      if (hide) this.showExposed = false
    },
  },
})
