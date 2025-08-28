import { beforeEach, describe, it, expect } from 'vitest'
import { getUsersMemory, setMemory } from '@/backend/infra/state'

async function post(path: string, body?: unknown, init?: RequestInit) {
  return fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  })
}

// Send intentionally malformed JSON with application/json header
async function rawPost(path: string, raw: string) {
  return fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw,
  })
}

async function get(path: string, init?: RequestInit) {
  return fetch(path, { method: 'GET', ...init })
}

describe('api.handlers (MSW integration)', () => {
  beforeEach(async () => {
    // reset DB between tests
    await post('/api/admin/reset', { seed: 1234 })
  })

  it('POST /api/boot initializes DB (idempotent)', async () => {
    const r = await post('/api/boot', { seed: 1234 })
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toEqual({ ok: true })
  })

  it('POST /api/boot tolerates invalid JSON body (safeJson fallback)', async () => {
    const r = await rawPost('/api/boot', '{ not-json')
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

  it('POST/GET /api/admin/bot-delay clamps negative values to [0,0]', async () => {
    await post('/api/admin/bot-delay', { minMs: -5, maxMs: -1 })
    const r = await get('/api/admin/bot-delay')
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toEqual({ minMs: 0, maxMs: 0 })
  })

  it('POST /api/reveal maps NOT_FOUND to 404', async () => {
    await post('/api/boot', { seed: 999 })
    const r = await post('/api/reveal', { id: 'does-not-exist' })
    expect(r.status).toBe(404)
    const j = await r.json()
    expect(j).toEqual({ error: 'NOT_FOUND' })
  })

  it('POST /api/reveal with invalid JSON uses fallback and returns 404', async () => {
    await post('/api/boot', { seed: 123 })
    const r = await rawPost('/api/reveal', '{ bad')
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

  it('POST /api/admin/pick-random-player succeeds and sets a current player', async () => {
    await post('/api/boot', { seed: 2025 })
    const r = await post('/api/admin/pick-random-player')
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toHaveProperty('ok', true)
    expect(j).toHaveProperty('playerId')
  })

  it('POST /api/admin/reset returns ok and meta', async () => {
    const r = await post('/api/admin/reset', { seed: 777 })
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toHaveProperty('ok', true)
    expect(j).toHaveProperty('meta')
    expect(j.meta).toHaveProperty('version')
    expect(j.meta).toHaveProperty('etag')
  })

  it('POST /api/admin/reset tolerates invalid JSON body', async () => {
    const r = await rawPost('/api/admin/reset', '{ nope')
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toHaveProperty('ok', true)
    expect(j).toHaveProperty('meta')
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
    const r2 = await post('/api/users/assign', undefined, {
      headers: { cookie: String(setCookie) },
    })
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

  it('POST /api/users/resolve tolerates invalid JSON body (fallback to empty ids)', async () => {
    const r = await rawPost('/api/users/resolve', '{ nope')
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(Array.isArray(j.users)).toBe(true)
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

  it('POST /api/bot/step maps NOT_BOOTED to 503', async () => {
    // Force backend memory to null so botStep returns NOT_BOOTED
    setMemory(null)
    const r = await post('/api/bot/step')
    expect(r.status).toBe(503)
    const j = await r.json()
    expect(j).toEqual({ error: 'NOT_BOOTED' })
  })

  it('POST /api/bot/step returns ok after boot', async () => {
    await post('/api/boot', { seed: 4242 })
    const r = await post('/api/bot/step')
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j).toHaveProperty('ok', true)
  })

  it('POST /api/admin/pick-random-player maps NO_ELIGIBLE to 400 when all played', async () => {
    await post('/api/boot', { seed: 13579 })
    // Mark all users as played
    const users = getUsersMemory()!
    for (const u of Object.values(users)) u.played = true
    const r = await post('/api/admin/pick-random-player')
    expect(r.status).toBe(400)
    const j = await r.json()
    expect(j).toEqual({ error: 'NO_ELIGIBLE' })
  })

  it('POST /api/reveal maps ALREADY_REVEALED, NOT_ELIGIBLE and ALREADY_PLAYED to proper statuses', async () => {
    await post('/api/admin/reset', { seed: 4242 })
    // First reveal a cell (no player attribution), then reveal again => 409
    let r = await post('/api/reveal', { id: 'r0-c0' })
    expect(r.status).toBe(200)
    r = await post('/api/reveal', { id: 'r0-c0' })
    expect(r.status).toBe(409)

    // NOT_ELIGIBLE: use a non-existent playerId
    r = await post('/api/reveal', { id: 'r0-c1', playerId: 'does-not-exist' })
    expect(r.status).toBe(403)

    // ALREADY_PLAYED: get a valid player via users/assign, reveal once, then attempt again
    const a = await (await post('/api/users/assign', { clientId: 'api-reveal-player' })).json()
    r = await post('/api/reveal', { id: 'r0-c2', playerId: a.userId })
    expect(r.status).toBe(200)
    r = await post('/api/reveal', { id: 'r0-c3', playerId: a.userId })
    expect(r.status).toBe(409)
  })
})
