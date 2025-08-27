import { defineStore } from 'pinia'
import { useAdminGameStore } from '@/frontend/features/game/store/admin'

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
        const adminGame = useAdminGameStore()
        if (adminGame.exposedTargets.length === 0) {
          void adminGame.loadExposedTargets()
        }
      }
    },
  },
})
