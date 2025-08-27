import { describe, it, expect, vi, beforeEach } from 'vitest'

async function deleteDb(name: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error || new Error('deleteDatabase error'))
    req.onblocked = () => resolve()
  })
}

async function fresh() {
  vi.resetModules()
  const mod = await import('@/backend/infra/idb')
  // ensure clean DB state for each test
  await deleteDb(mod.DB_NAME)
  return mod
}

describe('infra/idb.openDatabase (with fake-indexeddb)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('creates required object stores when missing', async () => {
    const mod = await fresh()
    const db = await mod.openDatabase()
    const names = db.objectStoreNames
    expect(names.contains(mod.STORE_GRID)).toBe(true)
    expect(names.contains(mod.STORE_META)).toBe(true)
    expect(names.contains(mod.STORE_USERS)).toBe(true)
  })

  it('does not recreate stores when they already exist', async () => {
    const mod = await fresh()
    // First open triggers upgrade and store creation
    await mod.openDatabase()
    // Second open should reuse as-is
    const db2 = await mod.openDatabase()
    const names = db2.objectStoreNames
    expect(names.contains(mod.STORE_GRID)).toBe(true)
    expect(names.contains(mod.STORE_META)).toBe(true)
    expect(names.contains(mod.STORE_USERS)).toBe(true)
  })

  it('caches the database instance across calls', async () => {
    const mod = await fresh()
    const a = await mod.openDatabase()
    const b = await mod.openDatabase()
    expect(a).toBe(b)
  })

  it('responds to versionchange by clearing cache and reopening to a new instance', async () => {
    const mod = await fresh()
    const a = await mod.openDatabase()
    // Manually invoke the handler assigned in openDatabase
    const handler = (a as unknown as { onversionchange: null | (() => void) }).onversionchange
    expect(typeof handler).toBe('function')
    if (handler) handler()
    const c = await mod.openDatabase()
    expect(c).not.toBe(a)
  })
})
