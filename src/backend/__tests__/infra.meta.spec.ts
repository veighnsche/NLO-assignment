import { describe, it, expect, beforeEach } from 'vitest'
import { setMemory } from '@/backend/infra/state'
import { openDatabase, STORE_META } from '@/backend/infra/idb'
import type { GridState, Cell } from '@/backend/domain/grid/schema'

// Minimal in-memory state we can mutate during tests
const memory: GridState = {
  cells: {} as Record<string, Cell>,
  meta: { version: 1, etag: 'v-1' },
}

import { bumpVersion, persistMeta } from '@/backend/infra/meta'

beforeEach(() => {
  // reset memory
  memory.meta.version = 1
  memory.meta.etag = 'v-1'
  setMemory(memory)
})

describe('infra/meta.bumpVersion', () => {
  it('increments version and updates etag', () => {
    bumpVersion()
    expect(memory.meta.version).toBe(2)
    expect(memory.meta.etag).toBe('v-2')
  })
})

describe('infra/meta.persistMeta', () => {
  it('writes meta to the meta store and awaits tx.done', async () => {
    await persistMeta()
    const db = await openDatabase()
    const tx2 = db.transaction([STORE_META], 'readonly')
    const got = await tx2.objectStore(STORE_META).get('meta')
    await tx2.done
    expect(got).toEqual(memory.meta)
  })
})
