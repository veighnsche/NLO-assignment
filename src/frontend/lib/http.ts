export async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    let txt = ''
    try {
      txt = await res.text()
    } catch {}
    throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`)
  }
  return (await res.json()) as T
}
