import { openDatabase, STORE_META } from './idb'
import { getMemory, ensureBooted } from './state'
import { makeEtag } from '../domain/grid/schema'

export function bumpVersion(): void {
  const memory = getMemory()
  ensureBooted(memory)
  memory.meta.version += 1
  memory.meta.etag = makeEtag(memory.meta.version)
}

export async function persistMeta(): Promise<void> {
  const memory = getMemory()
  ensureBooted(memory)
  const db = await openDatabase()
  const tx = db.transaction([STORE_META], 'readwrite')
  await tx.objectStore(STORE_META).put(memory.meta, 'meta')
  await tx.done
}
