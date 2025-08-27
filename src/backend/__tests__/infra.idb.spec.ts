import { describe, it, expect, vi, beforeEach } from 'vitest'

// Helpers to build a mock IDB database object
function createMockDb(existingStores: Set<string>) {
  const created: string[] = []
  const createObjectStore = vi.fn((name: string) => {
    existingStores.add(name)
    created.push(name)
    return {}
  })
  const mockDb: any = {
    objectStoreNames: {
      contains: (name: string) => existingStores.has(name),
    },
    createObjectStore,
    close: vi.fn(),
    // will be set by the impl under test
    onversionchange: undefined as any,
  }
  return { mockDb, createObjectStore, created }
}

async function freshImport(existingStores: string[] = []) {
  vi.resetModules()

  const storeSet = new Set(existingStores)
  const { mockDb, createObjectStore, created } = createMockDb(storeSet)

  const openDBSpy = vi.fn(async (_name: string, _version: number, opts?: { upgrade?: (db: any) => void }) => {
    // Simulate upgrade callback on open
    opts?.upgrade?.(mockDb)
    return mockDb
  })

  vi.mock('idb', () => ({
    openDB: openDBSpy,
  }))

  const mod = await import('@/backend/infra/idb')
  return { mod, mockDb, createObjectStore, created, storeSet, openDBSpy }
}

// TODO: Re-enable these tests with a stable mocking strategy (e.g., vi.doMock or a
// small wrapper around idb). Current approach conflicts with Vitest's hoisted mocks.
describe.skip('infra/idb.openDatabase', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('creates required object stores when missing', async () => {
    const { mod, created } = await freshImport([])
    await mod.openDatabase()
    expect(created).toEqual(expect.arrayContaining([mod.STORE_GRID, mod.STORE_META, mod.STORE_USERS]))
  })

  it('does not recreate stores when they already exist', async () => {
    const { mod, createObjectStore } = await freshImport([ 'grid', 'meta', 'users' ])
    await mod.openDatabase()
    expect(createObjectStore).not.toHaveBeenCalled()
  })

  it('caches the database instance across calls', async () => {
    const { mod, createObjectStore } = await freshImport([])
    const a = await mod.openDatabase()
    const b = await mod.openDatabase()
    // Should return the exact same instance
    expect(a).toBe(b)
    // And should not attempt to create stores more than the initial upgrade (3 calls)
    expect(createObjectStore).toHaveBeenCalledTimes(3)
  })
})
