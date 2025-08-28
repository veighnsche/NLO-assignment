import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/frontend/lib/http', () => ({
  jsonFetch: vi.fn(),
}))

import { jsonFetch } from '@/frontend/lib/http'
import {
  apiAdminReset,
  apiAdminSetBotDelay,
  apiAdminGetBotDelay,
  apiAdminGetTargets,
  apiAdminGetCurrentPlayer,
  apiAdminSetCurrentPlayer,
  apiAdminPickRandomPlayer,
  apiAdminEligibleUsers,
} from '../api'

afterEach(() => {
  vi.clearAllMocks()
})

describe('admin api wrappers', () => {
  it('apiAdminReset posts mode and seed', async () => {
    ;(jsonFetch as any).mockResolvedValueOnce({ ok: true })
    await apiAdminReset('hard', 123)
    expect(jsonFetch).toHaveBeenCalledWith('/api/admin/reset', {
      method: 'POST',
      body: JSON.stringify({ mode: 'hard', seed: 123 }),
    })
  })

  it('apiAdminSetBotDelay posts min/max', async () => {
    ;(jsonFetch as any).mockResolvedValueOnce({ ok: true })
    await apiAdminSetBotDelay(100, 200)
    expect(jsonFetch).toHaveBeenCalledWith('/api/admin/bot-delay', {
      method: 'POST',
      body: JSON.stringify({ minMs: 100, maxMs: 200 }),
    })
  })

  it('apiAdminGetBotDelay gets current values', async () => {
    const payload = { minMs: 100, maxMs: 200 }
    ;(jsonFetch as any).mockResolvedValueOnce(payload)
    const res = await apiAdminGetBotDelay()
    expect(res).toBe(payload)
    expect(jsonFetch).toHaveBeenCalledWith('/api/admin/bot-delay')
  })

  it('apiAdminGetTargets returns targets', async () => {
    const payload = { targets: [] }
    ;(jsonFetch as any).mockResolvedValueOnce(payload)
    const res = await apiAdminGetTargets()
    expect(res).toBe(payload)
    expect(jsonFetch).toHaveBeenCalledWith('/api/admin/targets')
  })

  it('apiAdminGetCurrentPlayer returns current player id', async () => {
    const payload = { currentPlayerId: 'u1' }
    ;(jsonFetch as any).mockResolvedValueOnce(payload)
    const res = await apiAdminGetCurrentPlayer()
    expect(res).toBe(payload)
    expect(jsonFetch).toHaveBeenCalledWith('/api/admin/current-player')
  })

  it('apiAdminSetCurrentPlayer posts playerId', async () => {
    const payload = { ok: true }
    ;(jsonFetch as any).mockResolvedValueOnce(payload)
    const res = await apiAdminSetCurrentPlayer('u1')
    expect(res).toBe(payload)
    expect(jsonFetch).toHaveBeenCalledWith('/api/admin/current-player', {
      method: 'POST',
      body: JSON.stringify({ playerId: 'u1' }),
    })
  })

  it('apiAdminPickRandomPlayer posts without body', async () => {
    const payload = { ok: true, playerId: 'u2' }
    ;(jsonFetch as any).mockResolvedValueOnce(payload)
    const res = await apiAdminPickRandomPlayer()
    expect(res).toBe(payload)
    expect(jsonFetch).toHaveBeenCalledWith('/api/admin/pick-random-player', { method: 'POST' })
  })

  it('apiAdminEligibleUsers builds query params', async () => {
    const payload = { total: 0, users: [] }
    ;(jsonFetch as any).mockResolvedValueOnce(payload)
    const res = await apiAdminEligibleUsers(5, 10, 'al')
    expect(res).toBe(payload)
    expect((jsonFetch as any).mock.calls[0][0]).toContain('/api/admin/eligible-users?')
    expect((jsonFetch as any).mock.calls[0][0]).toContain('offset=5')
    expect((jsonFetch as any).mock.calls[0][0]).toContain('limit=10')
    expect((jsonFetch as any).mock.calls[0][0]).toContain('query=al')
  })
})
