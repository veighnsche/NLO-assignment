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
})
