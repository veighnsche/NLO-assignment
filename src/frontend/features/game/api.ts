import { jsonFetch } from '@/frontend/lib/http'
import type { Snapshot, RevealResponse, BotStepResponse } from '@/frontend/types/api'

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

// Users-related APIs (part of game feature)
export async function apiUsersAssign(clientId?: string): Promise<{ userId: string; name: string }> {
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

export async function apiUsersResolve(
  ids: string[],
): Promise<{ users: Array<{ id: string; name: string }> }> {
  return jsonFetch('/api/users/resolve', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}
