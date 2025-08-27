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
} from '@/backend/db/idb'

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
]
