import { openDatabase, STORE_META } from '../core/storage'
import { getMemory, getUsersMemory, ensureBooted } from '../core/state'
import { mixSeedWithString } from '../rng'
import type { User } from '../users'
import { makeEtag } from '../schema'

function bumpVersion(): void {
  const memory = getMemory()
  ensureBooted(memory)
  memory.meta.version += 1
  memory.meta.etag = makeEtag(memory.meta.version)
}

async function persistMeta(): Promise<void> {
  const memory = getMemory()
  ensureBooted(memory)
  const db = await openDatabase()
  const tx = db.transaction([STORE_META], 'readwrite')
  await tx.objectStore(STORE_META).put(memory.meta, 'meta')
  await tx.done
}


export function getCurrentPlayer(): { currentPlayerId?: string } {
  const memory = getMemory()
  ensureBooted(memory)
  return { currentPlayerId: memory.meta.currentPlayerId }
}

export async function setCurrentPlayer(playerId: string | null): Promise<{ ok: true } | { error: 'NOT_ELIGIBLE' }> {
  const memory = getMemory()
  ensureBooted(memory)
  const users = getUsersMemory()
  if (playerId) {
    if (!users || !users[playerId] || users[playerId].played) {
      return { error: 'NOT_ELIGIBLE' }
    }
    memory.meta.currentPlayerId = playerId
  } else {
    delete memory.meta.currentPlayerId
  }
  bumpVersion()
  await persistMeta()
  return { ok: true }
}

export function listEligibleUsers(
  offset = 0,
  limit = 100,
  query?: string,
): { total: number; users: Array<{ id: string; name: string }> } {
  const users = getUsersMemory()
  if (!users) return { total: 0, users: [] }
  const all = Object.values(users).filter((u) => !u.played)
  let filtered = all
  if (query && query.trim()) {
    const q = query.trim().toLowerCase()
    filtered = all.filter((u) => u.id.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
  }
  const total = filtered.length
  const page = filtered.slice(Math.max(0, offset), Math.max(0, offset) + Math.max(0, limit))
  return { total, users: page.map((u) => ({ id: u.id, name: u.name })) }
}

export function assignUserForClient(clientId: string): { id: string; name: string } {
  const memory = getMemory()
  ensureBooted(memory)
  const users = getUsersMemory()
  if (!users) throw new Error('Users not initialized')
  const baseSeed = (memory.meta.seed ?? 0x9e3779b9) | 0
  const rng = mixSeedWithString(baseSeed, clientId)
  const ids = Object.keys(users)
  const idx = rng.nextInt(ids.length)
  const uid = ids[idx]
  const u: User = users[uid]
  return { id: u.id, name: u.name }
}

export function resolveUsers(ids: string[]): Array<{ id: string; name: string }> {
  const users = getUsersMemory()
  if (!users) return []
  const out: Array<{ id: string; name: string }> = []
  for (const id of ids) {
    const u = users[id]
    if (u) out.push({ id: u.id, name: u.name })
  }
  return out
}
