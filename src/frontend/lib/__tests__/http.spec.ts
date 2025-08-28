import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpError, jsonFetch } from '../http'

// Reset fetch after each
afterEach(() => {
  vi.restoreAllMocks()
})

describe('jsonFetch', () => {
  it('returns parsed JSON on 200 with application/json', async () => {
    const payload = { ok: true }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as any,
    )

    const res = await jsonFetch<typeof payload>('/api/test')
    expect(res).toEqual(payload)
  })

  it('returns undefined for 204 No Content', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 204 }) as any)

    const res = await jsonFetch<void>('/api/empty')
    expect(res).toBeUndefined()
  })

  it('returns text when non-json content type', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('plain-text', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      }) as any,
    )

    const res = await jsonFetch<string>('/api/text')
    expect(res).toBe('plain-text')
  })

  it('throws HttpError with best-effort body on non-2xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('bad request', { status: 400, statusText: 'Bad Request' }) as any,
    )

    await expect(jsonFetch('/api/fail')).rejects.toMatchObject({
      name: 'HttpError',
      status: 400,
    })
  })
})
