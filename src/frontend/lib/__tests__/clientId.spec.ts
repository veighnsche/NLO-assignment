import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getStableClientId } from '../clientId'

const originalLocalStorage = globalThis.localStorage

describe('getStableClientId', () => {
  beforeEach(() => {
    // Fresh in-memory localStorage mock for each test
    const store = new Map<string, string>()
    const ls = {
      getItem: vi.fn((k: string) => store.get(k) ?? null),
      setItem: vi.fn((k: string, v: string) => void store.set(k, String(v))),
      removeItem: vi.fn((k: string) => void store.delete(k)),
      clear: vi.fn(() => void store.clear()),
      key: vi.fn((i: number) => Array.from(store.keys())[i] ?? null),
      length: 0,
    } as unknown as Storage
    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true })
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: originalLocalStorage, configurable: true })
    vi.restoreAllMocks()
  })

  it('returns the same ID on subsequent calls (persists to localStorage)', () => {
    const a = getStableClientId()
    const b = getStableClientId()
    expect(a).toBe(b)
    expect(a).toMatch(/^cid-/)
  })

  it('falls back to random id when localStorage throws', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('no storage')
        },
      },
      configurable: true,
    })
    const id = getStableClientId()
    expect(id).toMatch(/^cid-/)
  })
})
