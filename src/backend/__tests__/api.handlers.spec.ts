import { beforeEach, describe, it, expect } from 'vitest'

async function post(path: string, body?: unknown, init?: RequestInit) {
  return fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  })
}

async function get(path: string, init?: RequestInit) {
  return fetch(path, { method: 'GET', ...init })
}

describe('api.handlers (MSW integration)', () => {
  beforeEach(async () => {
    // reset DB between tests
    await post('/api/admin/reset', { mode: 'hard', seed: 1234 })
  })

  it('POST /api/boot initializes DB (idempotent)', async () => {
    const r = await post('/api/boot', { seed: 1234 })
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toEqual({ ok: true })
  })

  it('GET /api/snapshot returns meta and revealed array', async () => {
    await post('/api/boot', { seed: 42 })
    const r = await get('/api/snapshot')
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toHaveProperty('meta')
    expect(j).toHaveProperty('revealed')
    expect(Array.isArray(j.revealed)).toBe(true)
  })

  it('POST/GET /api/admin/bot-delay validates and round-trips', async () => {
    const bad = await post('/api/admin/bot-delay', { minMs: 1 })
    expect(bad.status).toBe(400)

    const ok = await post('/api/admin/bot-delay', { minMs: 5, maxMs: 7 })
    expect(ok.status).toBe(200)

    const r = await get('/api/admin/bot-delay')
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toEqual({ minMs: 5, maxMs: 7 })
  })

  it('POST /api/reveal maps NOT_FOUND to 404', async () => {
    await post('/api/boot', { seed: 999 })
    const r = await post('/api/reveal', { id: 'does-not-exist' })
    expect(r.status).toBe(404)
    const j = await r.json()
    expect(j).toEqual({ error: 'NOT_FOUND' })
  })

  it('GET /api/admin/targets returns list of target cells', async () => {
    await post('/api/boot', { seed: 2024 })
    const r = await get('/api/admin/targets')
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toHaveProperty('targets')
    expect(Array.isArray(j.targets)).toBe(true)
  })

  it('POST /api/admin/reset returns ok and meta', async () => {
    const r = await post('/api/admin/reset', { mode: 'hard', seed: 777 })
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toHaveProperty('ok', true)
    expect(j).toHaveProperty('meta')
    expect(j.meta).toHaveProperty('version')
    expect(j.meta).toHaveProperty('etag')
  })

  it('POST /api/users/assign issues cookie when missing and is deterministic with explicit clientId', async () => {
    // No clientId: should set cookie
    const r1 = await post('/api/users/assign', {})
    expect(r1.status).toBe(200)
    const setCookie = r1.headers.get('set-cookie')
    expect(setCookie).toBeTruthy()
    const j1 = await r1.json()
    expect(j1).toHaveProperty('userId')

    // Use the cookie to assign again and expect a valid response
    const r2 = await post('/api/users/assign', undefined, { headers: { cookie: String(setCookie) } })
    expect(r2.status).toBe(200)
    const j2 = await r2.json()
    expect(j2).toHaveProperty('userId')

    // Deterministic mapping for explicit clientId
    const r3 = await post('/api/users/assign', { clientId: 'client-123' })
    const a = await r3.json()
    const r4 = await post('/api/users/assign', { clientId: 'client-123' })
    const b = await r4.json()
    expect(a).toEqual(b)
  })

  it('POST /api/users/resolve returns only known ids', async () => {
    const a = await (await post('/api/users/assign', { clientId: 'resolve-a' })).json()
    const b = await (await post('/api/users/assign', { clientId: 'resolve-b' })).json()
    const r = await post('/api/users/resolve', { ids: [a.userId, b.userId, 'nope'] })
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(Array.isArray(j.users)).toBe(true)
    const ids = j.users.map((u: { id: string; name: string }) => u.id).sort()
    expect(ids).toEqual([a.userId, b.userId].sort())
  })

  it('GET/POST /api/admin/current-player round-trips and validates', async () => {
    // Clear first
    let r = await post('/api/admin/current-player', { playerId: null })
    expect(r.status).toBe(200)
    // Assign a valid player via users/assign
    const assigned = await (await post('/api/users/assign', { clientId: 'curp' })).json()
    r = await post('/api/admin/current-player', { playerId: assigned.userId })
    expect(r.status).toBe(200)
    // Read back
    const g = await get('/api/admin/current-player')
    expect(g.status).toBe(200)
    const gj = await g.json()
    expect(gj).toHaveProperty('currentPlayerId', assigned.userId)
    // Invalid user should return error mapping 403
    const bad = await post('/api/admin/current-player', { playerId: 'does-not-exist' })
    expect(bad.status).toBe(403)
  })

  it('GET /api/admin/eligible-users paginates and filters', async () => {
    // page size 5
    let r = await get('/api/admin/eligible-users?offset=0&limit=5')
    expect(r.status).toBe(200)
    let j = await r.json()
    expect(j).toHaveProperty('total')
    expect(j).toHaveProperty('users')
    expect(j.users.length).toBeLessThanOrEqual(5)

    // Use a substring of a returned name as query
    if (j.users.length > 0) {
      const q = j.users[0].name.split(' ')[0]
      r = await get(`/api/admin/eligible-users?offset=0&limit=100&query=${encodeURIComponent(q)}`)
      expect(r.status).toBe(200)
      j = await r.json()
      expect(j.total).toBeGreaterThan(0)
    }
  })
})
