// Shared client-side representations (mirroring backend schema)
export type PrizeType = 'none' | 'consolation' | 'grand'

export interface Prize {
  type: PrizeType
  amount: 0 | 100 | 25000
}

export interface Cell {
  id: string
  row: number
  col: number
  revealed: boolean
  prize?: Prize
  revealedBy?: string
  revealedAt?: string
}

export interface GridMeta {
  version: number
  etag: string
  seed?: number
}

export interface Snapshot {
  meta: {
    version: number
    etag: string
  }
  revealed: Cell[]
  openedCount: number
  total: number
}

// Response types mirroring backend contracts
export type RevealResponse =
  | { ok: true; cell: Cell; meta: GridMeta }
  | { error: 'NOT_FOUND' | 'ALREADY_REVEALED' | 'ALREADY_PLAYED' | 'NOT_YOUR_TURN' | 'NOT_ELIGIBLE' }

export type BotStepResponse =
  | { ok: true; revealed?: Cell; meta: GridMeta; done: boolean }
  | { error: 'NOT_BOOTED' }

export interface AdminResetResponse {
  ok: true
  meta: GridMeta
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

export async function apiReveal(id: string, playerId?: string): Promise<RevealResponse> {
  return jsonFetch<RevealResponse>('/api/reveal', {
    method: 'POST',
    body: JSON.stringify({ id, playerId }),
  })
}

export async function apiBotStep(): Promise<BotStepResponse> {
  return jsonFetch<BotStepResponse>('/api/bot/step', { method: 'POST' })
}

export async function apiAdminReset(
  mode: 'soft' | 'hard',
  seed?: number,
): Promise<AdminResetResponse> {
  return jsonFetch<AdminResetResponse>('/api/admin/reset', {
    method: 'POST',
    body: JSON.stringify({ mode, seed }),
  })
}

export async function apiAdminSetBotDelay(minMs: number, maxMs: number): Promise<{ ok: true }> {
  return jsonFetch<{ ok: true }>('/api/admin/bot-delay', {
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

// --- Users & Admin: Players ---

export async function apiUsersAssign(clientId?: string): Promise<{ userId: string; name: string }> {
  // Ensure a stable client id across sessions without relying on cookies.
  // This avoids variability when the Service Worker (MSW) or fetch layer doesn't persist cookies.
  function getStableClientId(): string {
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
      // Fallback: ephemeral id if localStorage is unavailable (e.g., SSR/tests)
      return `cid-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`
    }
  }

  const effectiveClientId = clientId || getStableClientId()
  const body = JSON.stringify({ clientId: effectiveClientId })
  return jsonFetch<{ userId: string; name: string }>('/api/users/assign', {
    method: 'POST',
    body,
  })
}

export async function apiUsersResolve(ids: string[]): Promise<{ users: Array<{ id: string; name: string }> }> {
  return jsonFetch('/api/users/resolve', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

export async function apiAdminGetCurrentPlayer(): Promise<{ currentPlayerId?: string }> {
  return jsonFetch('/api/admin/current-player')
}

export async function apiAdminSetCurrentPlayer(playerId: string | null): Promise<{ ok: true } | { error: 'NOT_ELIGIBLE' }> {
  return jsonFetch('/api/admin/current-player', {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  })
}

export async function apiAdminPickRandomPlayer(): Promise<{ ok: true; playerId: string } | { error: 'NO_ELIGIBLE' }> {
  return jsonFetch('/api/admin/pick-random-player', { method: 'POST' })
}

export async function apiAdminEligibleUsers(
  offset = 0,
  limit = 100,
  query?: string,
): Promise<{ total: number; users: Array<{ id: string; name: string }> }> {
  const params = new URLSearchParams()
  params.set('offset', String(offset))
  params.set('limit', String(limit))
  if (query) params.set('query', query)
  return jsonFetch(`/api/admin/eligible-users?${params.toString()}`)
}
