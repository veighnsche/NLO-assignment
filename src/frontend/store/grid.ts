import { defineStore } from 'pinia'
import { apiBoot, apiSnapshot, apiReveal, apiBotStep } from '@/frontend/api'

export const useGridStore = defineStore('grid', {
  state: () => ({
    meta: null as null | {
      version: number
      etag: string
      seed?: number
      revealOrder?: string[]
      revealIndex?: number
    },
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
    isBooting: false,
    isRefreshing: false,
    isRevealing: false,
    botTimerId: null as number | null,
  }),

  getters: {
    revealedSet(state): Set<string> {
      return new Set(state.revealed.map((c) => c.id))
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
        this.meta = snap.meta
        this.revealed = snap.revealed
        this.openedCount = snap.openedCount
        this.total = snap.total
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
  },
})
