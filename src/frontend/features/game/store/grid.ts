import { defineStore } from 'pinia'
import {
  apiBoot,
  apiSnapshot,
  apiReveal,
  apiBotStep,
  apiAdminGetTargets,
  apiUsersAssign,
  apiUsersResolve,
} from '@/frontend/api/client'

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
    revealedByIdMap: new Map<string, RevealedCellEntry>() as Map<string, RevealedCellEntry>,
    // Assigned backend user identity
    assignedUser: null as null | { id: string; name: string },
    // Cache of user id -> name (populated from resolve endpoint and assignments)
    userNames: new Map<string, string>() as Map<string, string>,
    // Backend-selected current player (admin controlled)
    currentPlayerId: undefined as string | undefined,
    currentPlayerName: '' as string,
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
    userNameById(state): (id?: string | null) => string | null {
      return (id?: string | null) => {
        if (!id) return null
        return state.userNames.get(id) ?? null
      }
    },
    activePlayerId(state): string | null {
      return state.currentPlayerId ?? state.assignedUser?.id ?? null
    },
    activePlayerName(state): string {
      if (state.currentPlayerName) return state.currentPlayerName
      const id = state.currentPlayerId ?? state.assignedUser?.id
      if (!id) return ''
      return state.userNames.get(id) ?? state.assignedUser?.name ?? ''
    },
  },

  actions: {
    // Active player is admin-selected currentPlayer if present; otherwise assigned user
    getPlayerId(): string | null {
      return this.currentPlayerId ?? this.assignedUser?.id ?? null
    },
    getAssignedUserId(): string | null {
      return this.assignedUser?.id ?? null
    },
    async ensureAssignedUser() {
      if (this.assignedUser) return
      const u = await apiUsersAssign()
      this.assignedUser = { id: u.userId, name: u.name }
      // Seed names cache with our own assignment
      this.userNames.set(u.userId, u.name)
    },
    async refreshCurrentPlayer() {
      try {
        const mod = await import('@/frontend/api/client')
        const { currentPlayerId } = await mod.apiAdminGetCurrentPlayer()
        this.currentPlayerId = currentPlayerId ?? undefined
        if (this.currentPlayerId) {
          const id = this.currentPlayerId
          // Try cache first
          const cached = this.userNames.get(id)
          if (cached) {
            this.currentPlayerName = cached
          } else {
            try {
              const res = await mod.apiUsersResolve([id])
              const nm = res.users[0]?.name ?? ''
              if (nm) this.userNames.set(id, nm)
              this.currentPlayerName = nm
            } catch {
              this.currentPlayerName = ''
            }
          }
        } else {
          // Fallback to this browser's assigned user
          await this.ensureAssignedUser()
          this.currentPlayerName = this.assignedUser?.name ?? ''
        }
      } catch {
        this.currentPlayerId = undefined
        this.currentPlayerName = ''
      }
    },
    async boot(seed?: number) {
      this.isBooting = true
      try {
        await apiBoot(seed)
        this.networkOk = true
        await this.refresh()
        await this.ensureAssignedUser()
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
        const idsToResolve = new Set<string>()
        for (const c of snap.revealed) {
          this.revealedIds.add(c.id)
          this.revealedByIdMap.set(c.id, c)
          if (c.revealedBy && !this.userNames.has(c.revealedBy)) idsToResolve.add(c.revealedBy)
        }
        this.openedCount = snap.openedCount
        this.total = snap.total
        this.lastEtag = snap.meta.etag
        // Resolve any new user ids to names and cache them
        if (idsToResolve.size > 0) {
          try {
            const res = await apiUsersResolve(Array.from(idsToResolve))
            for (const u of res.users) this.userNames.set(u.id, u.name)
          } catch {
            // ignore resolve errors in dev
          }
        }
      } catch {
        this.networkOk = false
      } finally {
        this.isRefreshing = false
      }
    },

    userHasRevealed(): boolean {
      const pid = this.getPlayerId()
      if (!pid) return false
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
        // Ensure we have a backend-assigned user id
        await this.ensureAssignedUser()
        const pid: string | undefined = playerId ?? this.getPlayerId() ?? undefined
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
