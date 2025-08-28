import { defineStore } from 'pinia'
import { apiBoot, apiSnapshot, apiReveal } from '@/frontend/features/game/api'
import type { Cell } from '@/frontend/types/api'
import { useStatusStore } from '@/frontend/features/game/store/status'
import { useSessionStore } from '@/frontend/features/game/store/session'

// Strong type for revealed cell entries (reuse API Cell shape)
export type RevealedCellEntry = Cell

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
    // Stable structures kept as plain collections (mutated in place)
    revealedIds: new Set<string>() as Set<string>,
    // Stable Map for id -> revealed entry
    revealedByIdMap: new Map<string, RevealedCellEntry>() as Map<string, RevealedCellEntry>,
  }),

  getters: {
    revealedSet(state): Set<string> {
      // Return stable Set to avoid re-allocation per access
      return state.revealedIds
    },
    revealedById(state): Map<string, RevealedCellEntry> {
      // Return stable Map
      return state.revealedByIdMap as Map<string, RevealedCellEntry>
    },
  },

  actions: {
    async boot(seed?: number) {
      const status = useStatusStore()
      const session = useSessionStore()
      status.setBooting(true)
      try {
        await apiBoot(seed)
        status.setNetworkOk(true)
        await this.refresh()
        await session.ensureAssignedUser()
      } finally {
        status.setBooting(false)
      }
    },

    async refresh() {
      const status = useStatusStore()
      const session = useSessionStore()
      status.setRefreshing(true)
      try {
        const snap = await apiSnapshot()
        status.setNetworkOk(true)
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
          if (c.revealedBy) idsToResolve.add(c.revealedBy)
        }
        this.openedCount = snap.openedCount
        this.total = snap.total
        this.lastEtag = snap.meta.etag
        // Resolve any new user ids to names and cache them
        if (idsToResolve.size > 0) await session.resolveUserIds(Array.from(idsToResolve))
      } catch {
        status.setNetworkOk(false)
      } finally {
        status.setRefreshing(false)
      }
    },

    userHasRevealed(): boolean {
      const session = useSessionStore()
      const pid = session.activePlayerId
      if (!pid) return false
      return this.revealed.some((c) => c.revealedBy === pid)
    },

    async reveal(id: string, playerId?: string) {
      const status = useStatusStore()
      const session = useSessionStore()
      if (status.isRevealing) return
      if (this.userHasRevealed()) return
      status.setRevealing(true)
      try {
        // Ensure we have a backend-assigned user id
        await session.ensureAssignedUser()
        const pid: string | undefined = playerId ?? session.activePlayerId ?? undefined
        await apiReveal(id, pid)
        status.setNetworkOk(true)
        await this.refresh()
      } catch (err) {
        status.setNetworkOk(false)
        throw err
      } finally {
        status.setRevealing(false)
      }
    },
  },
})
