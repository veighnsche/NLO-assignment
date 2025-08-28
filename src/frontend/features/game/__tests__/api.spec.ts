import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/frontend/lib/http', () => ({
  jsonFetch: vi.fn(),
}))
vi.mock('@/frontend/lib/clientId', () => ({
  getStableClientId: vi.fn(() => 'cid-mock'),
}))

import { jsonFetch } from '@/frontend/lib/http'
import { getStableClientId } from '@/frontend/lib/clientId'
import {
  apiBoot,
  apiSnapshot,
  apiReveal,
  apiBotStep,
  apiUsersAssign,
  apiUsersResolve,
} from '../api'

afterEach(() => {
  vi.clearAllMocks()
})

describe('game api wrappers', () => {
  it('apiBoot POSTs to /api/boot with optional seed', async () => {
    ;(jsonFetch as any).mockResolvedValueOnce({ ok: true })
    await apiBoot(123)
    expect(jsonFetch).toHaveBeenCalledWith('/api/boot', {
      method: 'POST',
      body: JSON.stringify({ seed: 123 }),
    })
  })

  it('apiSnapshot GETs /api/snapshot', async () => {
    const snap = { cells: [], users: [] }
    ;(jsonFetch as any).mockResolvedValueOnce(snap)
    const res = await apiSnapshot()
    expect(res).toBe(snap)
    expect(jsonFetch).toHaveBeenCalledWith('/api/snapshot')
  })

  it('apiReveal POSTs id and playerId', async () => {
    const payload = { id: 'r1', prize: null }
    ;(jsonFetch as any).mockResolvedValueOnce(payload)
    const res = await apiReveal('c-1', 'u-1')
    expect(res).toBe(payload)
    expect(jsonFetch).toHaveBeenCalledWith('/api/reveal', {
      method: 'POST',
      body: JSON.stringify({ id: 'c-1', playerId: 'u-1' }),
    })
  })

  it('apiBotStep POSTs to /api/bot/step', async () => {
    const payload = { done: false }
    ;(jsonFetch as any).mockResolvedValueOnce(payload)
    const res = await apiBotStep()
    expect(res).toBe(payload)
    expect(jsonFetch).toHaveBeenCalledWith('/api/bot/step', { method: 'POST' })
  })

  it('apiUsersAssign uses provided clientId or falls back to getStableClientId()', async () => {
    const payload = { userId: 'u1', name: 'User 1' }
    ;(jsonFetch as any).mockResolvedValue(payload)

    await apiUsersAssign('cid-explicit')
    expect(jsonFetch).toHaveBeenCalledWith('/api/users/assign', {
      method: 'POST',
      body: JSON.stringify({ clientId: 'cid-explicit' }),
    })

    vi.clearAllMocks()
    ;(jsonFetch as any).mockResolvedValue(payload)
    await apiUsersAssign()
    expect(getStableClientId).toHaveBeenCalled()
    expect(jsonFetch).toHaveBeenCalledWith('/api/users/assign', {
      method: 'POST',
      body: JSON.stringify({ clientId: 'cid-mock' }),
    })
  })

  it('apiUsersResolve POSTs ids array', async () => {
    const payload = { users: [] }
    ;(jsonFetch as any).mockResolvedValueOnce(payload)
    const res = await apiUsersResolve(['a', 'b'])
    expect(res).toBe(payload)
    expect(jsonFetch).toHaveBeenCalledWith('/api/users/resolve', {
      method: 'POST',
      body: JSON.stringify({ ids: ['a', 'b'] }),
    })
  })
})
