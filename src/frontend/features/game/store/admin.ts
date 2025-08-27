import { defineStore } from 'pinia'
import { apiAdminGetTargets } from '@/frontend/features/admin/api'
import { useStatusStore } from '@/frontend/features/game/store/status'
import { useGridStore } from '@/frontend/features/game/store/grid'

export const useAdminGameStore = defineStore('adminGame', {
  state: () => ({
    targetsEtag: null as string | null,
    exposedTargets: [] as Array<{
      id: string
      row: number
      col: number
      prize: { type: 'consolation' | 'grand'; amount: 100 | 25000 }
    }>,
    exposedIds: new Set<string>() as Set<string>,
  }),
  getters: {
    exposedSet(state): Set<string> {
      return state.exposedIds
    },
  },
  actions: {
    async loadExposedTargets() {
      const status = useStatusStore()
      const grid = useGridStore()
      try {
        const currentEtag = grid.meta?.etag ?? null
        if (this.targetsEtag && currentEtag && this.targetsEtag === currentEtag) {
          return
        }
        const res = await apiAdminGetTargets()
        this.exposedTargets = res.targets
        this.exposedIds.clear()
        for (const t of res.targets) this.exposedIds.add(t.id)
        this.targetsEtag = currentEtag
        status.setNetworkOk(true)
      } catch {
        status.setNetworkOk(false)
      }
    },
    clearExposedTargets() {
      this.exposedTargets = []
      this.targetsEtag = null
      this.exposedIds.clear()
    },
  },
})
