import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setMemory } from '@/backend/infra/state'

// Minimal in-memory state we can mutate during tests
const memory = {
  cells: {},
  meta: { version: 1, etag: 'v-1' },
} as any

const putSpy = vi.fn()
const txDone = Promise.resolve()
const tx = {
  objectStore: () => ({ put: putSpy }),
  done: txDone,
}

// Mock the infra/idb module so persistMeta() doesn't touch real IndexedDB
vi.mock('@/backend/infra/idb', () => ({
  openDatabase: async () => ({
    transaction: (_stores: string[], _mode: string) => tx,
  }),
  STORE_META: 'meta',
}))

import { bumpVersion, persistMeta } from '@/backend/infra/meta'

beforeEach(() => {
  // reset memory
  memory.meta.version = 1
  memory.meta.etag = 'v-1'
  setMemory(memory)
  putSpy.mockClear()
})

describe('infra/meta.bumpVersion', () => {
  it('increments version and updates etag', () => {
    bumpVersion()
    expect(memory.meta.version).toBe(2)
    expect(memory.meta.etag).toBe('v-2')
  })
})

// TODO: Re-enable when a stable mock of './idb' is wired to meta.ts resolution or when adding a
// thin adapter to abstract idb.openDB. JSDOM doesn't provide indexedDB by default.
describe.skip('infra/meta.persistMeta', () => {
  it('writes meta to the meta store and awaits tx.done', async () => {
    await persistMeta()
    expect(putSpy).toHaveBeenCalledTimes(1)
    expect(putSpy).toHaveBeenCalledWith(memory.meta, 'meta')
  })
})
