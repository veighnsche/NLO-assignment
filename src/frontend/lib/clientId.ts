// Generates or retrieves a stable client ID stored in localStorage.
// Falls back to a random ID if storage is unavailable.
export function getStableClientId(): string {
  try {
    const key = 'nlo-client-id'
    let cid = localStorage.getItem(key)
    if (!cid) {
      const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      cid = `cid-${rand}`
      localStorage.setItem(key, cid)
    }
    return cid
  } catch {
    return `cid-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`
  }
}
