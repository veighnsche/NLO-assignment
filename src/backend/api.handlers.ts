// Endpoint definitions live in backend to reflect a real server layout.
// MSW under src/mocks/ just mounts these handlers in browser/tests.
import { http, HttpResponse } from 'msw'
import {
  bootDatabase,
  getSnapshotForClient,
  adminReset,
  revealCell,
  botStep,
  setBotDelayRange,
  getBotDelayRange,
  getAdminTargets,
  getCurrentPlayer,
  setCurrentPlayer,
  listEligibleUsers,
  assignUserForClient,
  resolveUsers,
} from '@/backend/db'

export const handlers = [
  http.post('/api/boot', async ({ request }) => {
    try {
      const body = (await request.json().catch(() => ({}))) as { seed?: number }
      await bootDatabase(typeof body?.seed === 'number' ? body.seed : undefined)
      return HttpResponse.json({ ok: true })
    } catch (err) {
      return HttpResponse.json({ ok: false, error: String(err) }, { status: 500 })
    }
  }),

  http.get('/api/snapshot', () => {
    try {
      const snapshot = getSnapshotForClient()
      return HttpResponse.json(snapshot)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.post('/api/reveal', async ({ request }) => {
    try {
      const body = (await request.json()) as { id: string; playerId?: string }
      const res = await revealCell(body.id, body.playerId)
      if ('error' in res) return HttpResponse.json(res, { status: 400 })
      return HttpResponse.json(res)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.post('/api/bot/step', async () => {
    try {
      const res = await botStep()
      if ('error' in res) return HttpResponse.json(res, { status: 400 })
      return HttpResponse.json(res)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.post('/api/admin/reset', async ({ request }) => {
    try {
      const body = (await request.json().catch(() => ({}))) as {
        mode?: 'soft' | 'hard'
        seed?: number
      }
      const mode = body.mode ?? 'hard'
      const res = await adminReset(mode, typeof body?.seed === 'number' ? body.seed : undefined)
      return HttpResponse.json(res)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.post('/api/admin/bot-delay', async ({ request }) => {
    try {
      const body = (await request.json().catch(() => ({}))) as {
        minMs?: number
        maxMs?: number
      }
      if (typeof body.minMs !== 'number' || typeof body.maxMs !== 'number') {
        return HttpResponse.json({ error: 'minMs and maxMs required' }, { status: 400 })
      }
      setBotDelayRange(body.minMs, body.maxMs)
      return HttpResponse.json({ ok: true })
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.get('/api/admin/bot-delay', () => {
    try {
      const range = getBotDelayRange()
      return HttpResponse.json(range)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  // Admin-only: expose hidden target cells (grand + consolation). Do not leak via snapshot.
  http.get('/api/admin/targets', () => {
    try {
      const targets = getAdminTargets()
      return HttpResponse.json({ targets })
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  // --- Users & Admin: Players ---
  http.post('/api/users/assign', async ({ request }) => {
    try {
      const body = (await request.json().catch(() => ({}))) as { clientId?: string }
      if (!body.clientId) return HttpResponse.json({ error: 'clientId required' }, { status: 400 })
      const u = assignUserForClient(body.clientId)
      return HttpResponse.json({ userId: u.id, name: u.name })
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.post('/api/users/resolve', async ({ request }) => {
    try {
      const body = (await request.json().catch(() => ({}))) as { ids?: string[] }
      const ids = Array.isArray(body.ids) ? body.ids : []
      const users = resolveUsers(ids)
      return HttpResponse.json({ users })
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.get('/api/admin/current-player', () => {
    try {
      return HttpResponse.json(getCurrentPlayer())
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.post('/api/admin/current-player', async ({ request }) => {
    try {
      const body = (await request.json().catch(() => ({}))) as { playerId?: string | null }
      const res = await setCurrentPlayer(body.playerId ?? null)
      if ('error' in res) return HttpResponse.json(res, { status: 400 })
      return HttpResponse.json(res)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.get('/api/admin/eligible-users', ({ request }) => {
    try {
      const url = new URL(request.url)
      const offset = Number(url.searchParams.get('offset') ?? '0')
      const limit = Number(url.searchParams.get('limit') ?? '100')
      const query = url.searchParams.get('query') ?? undefined
      const res = listEligibleUsers(Number.isFinite(offset) ? offset : 0, Number.isFinite(limit) ? limit : 100, query)
      return HttpResponse.json(res)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),
]
