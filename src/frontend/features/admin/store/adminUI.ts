import { defineStore } from 'pinia'
import { useExposedStore } from '@/frontend/features/admin/store/exposed'
import { apiAdminGetTargets } from '@/frontend/features/admin/api'
import { useGridStore } from '@/frontend/features/game/store/grid'

export const useAdminUiStore = defineStore('adminUi', {
  state: () => ({
    showExposed: false as boolean,
  }),
  actions: {
    toggleExposed(force?: boolean) {
      if (typeof force === 'boolean') {
        this.showExposed = force
      } else {
        this.showExposed = !this.showExposed
      }
      if (this.showExposed) {
        const exposed = useExposedStore()
        if (exposed.targets.length === 0) {
          // Lazy-load admin targets via API and populate shared store
          void (async () => {
            try {
              const grid = useGridStore()
              const etag = grid.meta?.etag ?? null
              const res = await apiAdminGetTargets()
              exposed.setTargets(res.targets, etag)
            } catch {
              // swallow in dev; admin UI can be tolerant to failures
            }
          })()
        }
      }
    },
  },
})
