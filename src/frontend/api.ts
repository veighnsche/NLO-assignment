export interface Snapshot {
  meta: {
    version: number
    etag: string
  }
  revealed: Array<{
    id: string
    row: number
    col: number
    revealed: boolean
    prize?: { type: 'none' | 'consolation' | 'grand'; amount: 0 | 100 | 25000 }
    revealedBy?: string
    revealedAt?: string
  }>
  openedCount: number
  total: number
}

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    let txt = ''
    try {
      txt = await res.text()
    } catch {}
    throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`)
  }
  return (await res.json()) as T
}

export async function apiBoot(seed?: number): Promise<void> {
  await jsonFetch<{ ok: true }>('/api/boot', {
    method: 'POST',
    body: JSON.stringify({ seed }),
  })
}

export async function apiSnapshot(): Promise<Snapshot> {
  return jsonFetch<Snapshot>('/api/snapshot')
}

export async function apiReveal(id: string, playerId?: string) {
  return jsonFetch('/api/reveal', {
    method: 'POST',
    body: JSON.stringify({ id, playerId }),
  })
}

export async function apiBotStep() {
  return jsonFetch('/api/bot/step', { method: 'POST' })
}

export async function apiAdminReset(mode: 'soft' | 'hard', seed?: number) {
  return jsonFetch('/api/admin/reset', {
    method: 'POST',
    body: JSON.stringify({ mode, seed }),
  })
}

export async function apiAdminSetBotDelay(minMs: number, maxMs: number) {
  return jsonFetch('/api/admin/bot-delay', {
    method: 'POST',
    body: JSON.stringify({ minMs, maxMs }),
  })
}

export async function apiAdminGetBotDelay(): Promise<{ minMs: number; maxMs: number }> {
  return jsonFetch<{ minMs: number; maxMs: number }>('/api/admin/bot-delay')
}

export async function apiAdminGetTargets(): Promise<{
  targets: Array<{
    id: string
    row: number
    col: number
    prize: { type: 'consolation' | 'grand'; amount: 100 | 25000 }
  }>
}> {
  return jsonFetch('/api/admin/targets')
}
