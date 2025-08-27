import { ref, onMounted, onUnmounted } from 'vue'
import type { useGridStore } from '@/frontend/features/game/store/grid'

export function useInitApp(grid: ReturnType<typeof useGridStore>) {
  const isInitializing = ref(true)

  async function init() {
    try {
      await grid.boot()
      await grid.refreshCurrentPlayer()
      grid.startBotPolling(1500)
    } finally {
      isInitializing.value = false
    }
  }

  onMounted(() => {
    void init()
  })

  onUnmounted(() => {
    grid.stopBotPolling()
  })

  return { isInitializing }
}
