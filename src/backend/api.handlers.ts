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
  pickRandomEligibleUser,
} from '@/backend'

// --- Small helpers ---
async function safeJson<T>(request: Request, fallback: T): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    return fallback
  }
}

function statusForDomainError(err:
  | 'NOT_FOUND'
  | 'ALREADY_REVEALED'
  | 'ALREADY_PLAYED'
  | 'NOT_YOUR_TURN'
  | 'NOT_ELIGIBLE'
  | 'NO_ELIGIBLE'
  | 'NOT_BOOTED',
): number {
  switch (err) {
    case 'NOT_FOUND':
      return 404
    case 'ALREADY_REVEALED':
    case 'ALREADY_PLAYED':
      return 409
    case 'NOT_YOUR_TURN':
    case 'NOT_ELIGIBLE':
      return 403
    case 'NO_ELIGIBLE':
      return 404
    case 'NOT_BOOTED':
      return 503
    default:
      return 400
  }
}

function parseCookie(header: string): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const idx = p.indexOf('=')
        const k = idx >= 0 ? p.slice(0, idx) : p
        const v = idx >= 0 ? decodeURIComponent(p.slice(idx + 1)) : ''
        return [k, v] as const
      }),
  ) as Record<string, string>
}

export const handlers = [
  http.post('/api/boot', async ({ request }) => {
    try {
      const body = await safeJson<{ seed?: number }>(request, {})
      await bootDatabase(typeof body?.seed === 'number' ? body.seed : undefined)
      return HttpResponse.json({ ok: true })
    } catch (err) {
      return HttpResponse.json({ ok: false, error: String(err) }, { status: 500 })
    }
  }),

  http.post('/api/admin/pick-random-player', async () => {
    try {
      const res = await pickRandomEligibleUser()
      if ('error' in res) return HttpResponse.json(res, { status: 400 })
      return HttpResponse.json(res)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
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
      const body = await safeJson<{ id: string; playerId?: string }>(request, { id: '' })
      const res = await revealCell(body.id, body.playerId)
      if ('error' in res) return HttpResponse.json(res, { status: statusForDomainError(res.error) })
      return HttpResponse.json(res)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.post('/api/bot/step', async () => {
    try {
      const res = await botStep()
      if ('error' in res) return HttpResponse.json(res, { status: statusForDomainError(res.error) })
      return HttpResponse.json(res)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.post('/api/admin/reset', async ({ request }) => {
    try {
      const body = await safeJson<{ mode?: 'soft' | 'hard'; seed?: number }>(request, {})
      const mode = body.mode ?? 'hard'
      const res = await adminReset(mode, typeof body?.seed === 'number' ? body.seed : undefined)
      return HttpResponse.json(res)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.post('/api/admin/bot-delay', async ({ request }) => {
    try {
      const body = await safeJson<{ minMs?: number; maxMs?: number }>(request, {})
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
      const body = await safeJson<{ clientId?: string }>(request, {})
      // Prefer explicit clientId from body; otherwise fall back to cookie-based id
      let cid = body.clientId
      let setCookieHeader: string | undefined
      if (!cid) {
        const cookieHeader = request.headers.get('cookie') || ''
        const cookies = parseCookie(cookieHeader)
        cid = cookies['nlo-client-id']
        if (!cid) {
          // Generate a simple random id; persistence via cookie
          const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
          cid = `cid-${rand}`
          setCookieHeader = `nlo-client-id=${encodeURIComponent(cid)}; Path=/; Max-Age=31536000; SameSite=Lax`
        }
      }
      const u = assignUserForClient(cid)
      const init = setCookieHeader ? { headers: { 'Set-Cookie': setCookieHeader } } : undefined
      return HttpResponse.json({ userId: u.id, name: u.name }, init)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),

  http.post('/api/users/resolve', async ({ request }) => {
    try {
      const body = await safeJson<{ ids?: string[] }>(request, {})
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
      const body = await safeJson<{ playerId?: string | null }>(request, {})
      const res = await setCurrentPlayer(body.playerId ?? null)
      if ('error' in res) return HttpResponse.json(res, { status: statusForDomainError(res.error) })
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
      const res = listEligibleUsers(
        Number.isFinite(offset) ? offset : 0,
        Number.isFinite(limit) ? limit : 100,
        query,
      )
      return HttpResponse.json(res)
    } catch (err) {
      return HttpResponse.json({ error: String(err) }, { status: 500 })
    }
  }),
]
