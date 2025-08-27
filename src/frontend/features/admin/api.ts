import { jsonFetch } from '@/frontend/lib/http'
import type { AdminResetResponse } from '@/frontend/types/api'

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

export async function apiAdminGetCurrentPlayer(): Promise<{ currentPlayerId?: string }> {
  return jsonFetch('/api/admin/current-player')
}

export async function apiAdminSetCurrentPlayer(
  playerId: string | null,
): Promise<{ ok: true } | { error: 'NOT_ELIGIBLE' }> {
  return jsonFetch('/api/admin/current-player', {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  })
}

export async function apiAdminPickRandomPlayer(): Promise<
  { ok: true; playerId: string } | { error: 'NO_ELIGIBLE' }
> {
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
