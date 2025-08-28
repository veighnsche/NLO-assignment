import { getMemory, getUsersMemory, ensureBooted } from '../infra/state'
import { mixSeedWithString } from '../domain/shared/rng'
import type { User } from '../domain/users/model'
import { bumpVersion, persistMeta } from '../infra/meta'

export async function pickRandomEligibleUser(): Promise<
  { ok: true; playerId: string } | { error: 'NO_ELIGIBLE' }
> {
  const memory = getMemory()
  ensureBooted(memory)
  const users = getUsersMemory()
  if (!users) return { error: 'NO_ELIGIBLE' }
  const pool = Object.values(users).filter((u) => !u.played)
  if (pool.length === 0) return { error: 'NO_ELIGIBLE' }
  const baseSeed = (memory.meta.seed ?? 0x9e3779b9) | 0
  // Mix with changing key so subsequent calls vary
  const key = `admin-pick-${memory.meta.version}`
  const rng = mixSeedWithString(baseSeed, key)
  const idx = rng.nextInt(pool.length)
  const chosen = pool[idx]
  memory.meta.currentPlayerId = chosen.id
  bumpVersion()
  await persistMeta()
  return { ok: true, playerId: chosen.id }
}

export function getCurrentPlayer(): { currentPlayerId?: string } {
  const memory = getMemory()
  ensureBooted(memory)
  return { currentPlayerId: memory.meta.currentPlayerId }
}

export async function setCurrentPlayer(
  playerId: string | null,
): Promise<{ ok: true } | { error: 'NOT_ELIGIBLE' }> {
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

/**
 * Deterministically map a client identifier to a user record.
 *
 * Semantics:
 * - Uses seeded RNG mixed with the provided clientId to pick a user id from the full users map.
 * - Does NOT filter out users who have already played. This function is intended to provide
 *   a stable display identity for a client/session. Actual play eligibility is enforced by
 *   admin/user selection and reveal logic (e.g., `pickRandomEligibleUser()` / `setCurrentPlayer()`),
 *   and by guards in the reveal service.
 *
 * If you need this to return only eligible users, filter the source ids to `!played` before
 * choosing an index with the RNG.
 */
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
