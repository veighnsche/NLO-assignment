import { useStatusStore } from '@/frontend/features/game/store/status'

export type ConnectivityOptions = {
  autoReloadOnReconnect?: boolean
}

let initialized = false
let cleanup: (() => void) | null = null

export function setupConnectivity(options: ConnectivityOptions = {}) {
  if (initialized) return cleanup
  initialized = true

  const { autoReloadOnReconnect = true } = options
  const status = useStatusStore()

  // Initial state from the browser
  const initial = typeof navigator !== 'undefined' ? navigator.onLine : true
  status.setNetworkOk(initial)

  let wasOffline = !initial

  const onOnline = () => {
    status.setNetworkOk(true)
    if (wasOffline && autoReloadOnReconnect) {
      wasOffline = false
      window.location.reload()
    }
  }

  const onOffline = () => {
    status.setNetworkOk(false)
    wasOffline = true
  }

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  cleanup = () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }

  return cleanup
}
