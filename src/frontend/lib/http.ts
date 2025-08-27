export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public bodyText: string,
  ) {
    super(`HTTP ${status}: ${bodyText || statusText}`)
    this.name = 'HttpError'
  }
 }

 export async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })

  // Non-2xx -> throw typed error with best-effort body
  if (!res.ok) {
    let txt = ''
    try {
      txt = await res.text()
    } catch {}
    throw new HttpError(res.status, res.statusText, txt)
  }

  // 204 No Content or empty body
  if (res.status === 204) {
    return undefined as unknown as T
  }

  const ct = res.headers.get('Content-Type') || res.headers.get('content-type') || ''
  const isJson = ct.includes('application/json')
  if (!isJson) {
    // If not JSON, return as text cast to T (callers should type accordingly if used)
    const txt = await res.text()
    return txt as unknown as T
  }
  return (await res.json()) as T
 }
