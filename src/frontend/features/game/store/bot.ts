import { defineStore } from 'pinia'
import { apiBotStep } from '@/frontend/features/game/api'
import { useStatusStore } from '@/frontend/features/game/store/status'
import { useGridStore } from '@/frontend/features/game/store/grid'

export const useBotStore = defineStore('bot', {
  state: () => ({
    botTimerId: null as number | null,
  }),
  actions: {
    startBotPolling(intervalMs = 1500) {
      if (this.botTimerId != null) return
      const status = useStatusStore()
      const grid = useGridStore()
      const handle = window.setInterval(async () => {
        try {
          await apiBotStep()
          status.setNetworkOk(true)
          await grid.refresh()
        } catch {
          status.setNetworkOk(false)
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

    setPollingInterval(intervalMs: number) {
      if (this.botTimerId != null) {
        this.stopBotPolling()
        this.startBotPolling(intervalMs)
      }
    },
  },
})
