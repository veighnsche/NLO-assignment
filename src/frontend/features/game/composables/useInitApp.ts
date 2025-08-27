import { ref, onMounted, onUnmounted } from 'vue'
import type { useGridStore } from '@/frontend/features/game/store/grid'
import { useSessionStore } from '@/frontend/features/game/store/session'
import { useBotStore } from '@/frontend/features/game/store/bot'

export function useInitApp(grid: ReturnType<typeof useGridStore>) {
  const isInitializing = ref(true)
  const session = useSessionStore()
  const bot = useBotStore()

  async function init() {
    try {
      await grid.boot()
      await session.refreshCurrentPlayer()
      bot.startBotPolling(1500)
    } finally {
      isInitializing.value = false
    }
  }

  onMounted(() => {
    void init()
  })

  onUnmounted(() => {
    bot.stopBotPolling()
  })

  return { isInitializing }
}
