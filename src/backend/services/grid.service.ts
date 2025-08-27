import type { Cell, CellId, GridMeta, Prize } from '../domain/grid/schema'
import { GRID_COLS, GRID_ROWS, GRID_TOTAL, PrizeNone } from '../domain/grid/schema'
import { seedGrid, getNextBotReveal } from '../domain/grid/seed'
import { generateDutchUsers, indexUsers } from '../domain/users/generator'
import { openDatabase, STORE_GRID, STORE_META, STORE_USERS } from '../infra/idb'
import {
  getMemory,
  setMemory,
  getTargets as getTargetsRef,
  setTargets as setTargetsRef,
  getUsersMemory,
  setUsersMemory,
  ensureBooted,
} from '../infra/state'
import { bumpVersion } from '../infra/meta'
import { getBotDelayRange as _getBotDelayRange } from './bot.service'
import { mixSeedWithString } from '../domain/shared/rng'
import { sleep, randomInt } from '../infra/util'

// sleep/randomInt moved to infra/util

async function persistAll(): Promise<void> {
  const memory = getMemory()
  ensureBooted(memory)
  const usersMemory = getUsersMemory()
  const database = await openDatabase()
  const tx = database.transaction([STORE_GRID, STORE_META, STORE_USERS], 'readwrite')
  await Promise.all([
    tx.objectStore(STORE_GRID).put(memory!.cells, 'grid'),
    tx.objectStore(STORE_META).put(memory!.meta, 'meta'),
    usersMemory ? tx.objectStore(STORE_USERS).put(usersMemory, 'users') : Promise.resolve(),
  ])
  await tx.done
}

// version bumping centralized in infra/meta.ts

function reseedTargetsFromSeed(seed?: number): void {
  // Use seedGrid only to derive targets deterministically; discard the generated state
  const { targets: t } = seedGrid(GRID_ROWS, GRID_COLS, seed)
  setTargetsRef(t)
}

export async function bootDatabase(seed?: number): Promise<void> {
  const database = await openDatabase()
  const tx = database.transaction([STORE_GRID, STORE_META, STORE_USERS], 'readonly')
  const storedCells = (await tx.objectStore(STORE_GRID).get('grid')) as
    | Record<CellId, Cell>
    | undefined
  const storedMeta = (await tx.objectStore(STORE_META).get('meta')) as GridMeta | undefined
  const storedUsers = (await tx.objectStore(STORE_USERS).get('users')) as
    | Record<string, { id: string; name: string; played: boolean }>
    | undefined
  await tx.done

  if (storedCells && storedMeta) {
    // Load into memory and reseed hidden targets deterministically from meta.seed
    setMemory({ cells: storedCells, meta: storedMeta })
    reseedTargetsFromSeed(storedMeta.seed)
    // Users: load or generate once
    if (storedUsers) {
      setUsersMemory(storedUsers)
    } else {
      const s = typeof storedMeta.seed === 'number' ? storedMeta.seed : 0x9e3779b9
      const users = generateDutchUsers(GRID_TOTAL, s)
      const usersMemory = indexUsers(users)
      setUsersMemory(usersMemory)
      const txw = database.transaction([STORE_USERS], 'readwrite')
      await txw.objectStore(STORE_USERS).put(usersMemory, 'users')
      await txw.done
    }
    // Backfill deterministic bot order if missing (older metas)
    const memory = getMemory()
    if (!memory!.meta.revealOrder || typeof memory!.meta.revealIndex !== 'number') {
      const { state: seeded } = seedGrid(GRID_ROWS, GRID_COLS, storedMeta.seed)
      memory!.meta.revealOrder = seeded.meta.revealOrder
      memory!.meta.revealIndex = 0
      await persistAll()
    }
    return
  }

  // Nothing in DB: seed fresh grid
  const { state, targets: t } = seedGrid(GRID_ROWS, GRID_COLS, seed)
  setMemory(state)
  setTargetsRef(t)
  // Generate users deterministically from the same seed
  const s = typeof seed === 'number' ? seed : 0x9e3779b9
  const users = generateDutchUsers(GRID_TOTAL, s)
  const usersMemory = indexUsers(users)
  setUsersMemory(usersMemory)
  const txw = database.transaction([STORE_GRID, STORE_META, STORE_USERS], 'readwrite')
  await Promise.all([
    txw.objectStore(STORE_GRID).put(state.cells, 'grid'),
    txw.objectStore(STORE_META).put(state.meta, 'meta'),
    txw.objectStore(STORE_USERS).put(usersMemory, 'users'),
  ])
  await txw.done
}

export function getSnapshotForClient(): {
  meta: { version: number; etag: string }
  revealed: Cell[]
  openedCount: number
  total: number
} {
  const memory = getMemory()
  ensureBooted(memory)
  const revealed = Object.values(memory.cells).filter((c): c is Cell => (c as Cell).revealed === true)
  return {
    meta: { version: memory.meta.version, etag: memory.meta.etag },
    revealed,
    openedCount: typeof memory.meta.openedCount === 'number' ? memory.meta.openedCount : revealed.length,
    total: GRID_TOTAL,
  }
}

/** Admin-only: return hidden target cells without modifying reveal state. */
export function getAdminTargets(): Array<{ id: CellId; row: number; col: number; prize: Prize }> {
  const memory = getMemory()
  ensureBooted(memory)
  const targets = getTargetsRef()
  const out: Array<{ id: CellId; row: number; col: number; prize: Prize }> = []
  for (const [id, prize] of Object.entries(targets) as Array<[CellId, Prize]>) {
    const cell = memory!.cells[id]
    if (cell) out.push({ id, row: cell.row, col: cell.col, prize })
  }
  return out
}

export async function revealCell(
  id: CellId,
  playerId?: string,
  options?: { overrideRevealedBy?: string; bypassEligibility?: boolean },
): Promise<
  | { ok: true; cell: Cell; meta: GridMeta }
  | {
      error: 'NOT_FOUND' | 'ALREADY_REVEALED' | 'ALREADY_PLAYED' | 'NOT_YOUR_TURN' | 'NOT_ELIGIBLE'
    }
> {
  const memory = getMemory()
  ensureBooted(memory)
  const bypass = options?.bypassEligibility === true
  // Enforce one reveal per player unless bypassing (used for bot attribution)
  if (!bypass && playerId && playerId !== 'bot') {
    // Ensure users are loaded
    const usersMemory = getUsersMemory()
    if (!usersMemory) {
      throw new Error('Users not initialized')
    }
    const user = usersMemory[playerId]
    if (!user) return { error: 'NOT_ELIGIBLE' }
    if (user.played) return { error: 'ALREADY_PLAYED' }
  }
  const cell = memory!.cells[id]
  if (!cell) return { error: 'NOT_FOUND' }
  if (cell.revealed) return { error: 'ALREADY_REVEALED' }

  // Determine prize from hidden targets; default to none
  const targets = getTargetsRef()
  const prize: Prize = targets[id] ?? PrizeNone

  // Mutate in-memory state
  cell.revealed = true
  cell.prize = prize
  const revealedBy = options?.overrideRevealedBy ?? playerId
  if (revealedBy) cell.revealedBy = revealedBy
  cell.revealedAt = new Date().toISOString()
  // Increment openedCount meta
  memory!.meta.openedCount = (memory!.meta.openedCount ?? 0) + 1

  // Mark user as played when applicable
  const usersMemory2 = getUsersMemory()
  if (!bypass && playerId && playerId !== 'bot' && usersMemory2) {
    const u = usersMemory2[playerId]
    if (u) u.played = true
  }

  bumpVersion()
  await persistAll()

  return { ok: true, cell, meta: memory!.meta }
}

export async function adminReset(
  mode: 'soft' | 'hard',
  seed?: number,
): Promise<{ ok: true; meta: GridMeta }> {
  // Both soft and hard perform a full reseed for this assignment
  const { state, targets: t } = seedGrid(GRID_ROWS, GRID_COLS, seed)
  setMemory(state)
  setTargetsRef(t)
  // Regenerate users deterministically on reset
  const s = typeof seed === 'number' ? seed : 0x9e3779b9
  const users = generateDutchUsers(GRID_TOTAL, s)
  const usersMemory = indexUsers(users)
  setUsersMemory(usersMemory)
  await persistAll()
  const memory = getMemory()!
  return { ok: true, meta: memory.meta }
}

export async function botStep(): Promise<
  { ok: true; revealed?: Cell; meta: GridMeta; done: boolean } | { error: 'NOT_BOOTED' }
> {
  const memory = getMemory()
  if (!memory) return { error: 'NOT_BOOTED' }
  // Randomized backend-side delay to simulate realistic server/bot timing
  const { minMs, maxMs } = _getBotDelayRange()
  // Use deterministic RNG so tests can be reproducible; falls back to Math.random when no seed.
  const baseSeed = (memory.meta.seed ?? 0x9e3779b9) | 0
  const delayRng = mixSeedWithString(baseSeed, `bot-delay-${memory.meta.version}`)
  await sleep(randomInt(minMs, maxMs, delayRng))
  // Ensure reveal order exists
  if (!memory.meta.revealOrder || typeof memory.meta.revealIndex !== 'number') {
    const { state: seeded } = seedGrid(GRID_ROWS, GRID_COLS, memory.meta.seed)
    memory.meta.revealOrder = seeded.meta.revealOrder
    memory.meta.revealIndex = 0
    await persistAll()
  }

  const { id, index } = getNextBotReveal(memory)
  // Advance cursor regardless, so future calls continue after the examined position
  memory.meta.revealIndex = index

  if (!id) {
    // No cells left to reveal
    await persistAll()
    return { ok: true, revealed: undefined, meta: memory.meta, done: true }
  }

  // Choose a deterministic user for this bot step based on seed and step index
  const usersMemory = getUsersMemory()
  let asUserId: string | undefined = undefined
  if (usersMemory) {
    const baseSeed = (memory.meta.seed ?? 0x9e3779b9) | 0
    const key = `bot-step-${index}`
    const rng = mixSeedWithString(baseSeed, key)
    const ids = Object.keys(usersMemory)
    if (ids.length > 0) {
      // Start from a deterministic index, then pick first not-yet-played user scanning forward
      const start = rng.nextInt(ids.length)
      for (let offset = 0; offset < ids.length; offset++) {
        const uid = ids[(start + offset) % ids.length]
        const u = usersMemory[uid]
        if (!u.played) {
          asUserId = uid
          break
        }
      }
      // Fallback: if all played, still attribute deterministically to starting id
      if (!asUserId) asUserId = ids[start]
    }
  }

  // Reveal chosen cell, bypassing eligibility/turn checks but attributing to deterministic user
  const res = await revealCell(id, 'bot', { overrideRevealedBy: asUserId, bypassEligibility: true })
  if ('error' in res) {
    // In case of a race where the cell got revealed between selection and reveal,
    // just persist meta and return done=false to try again on next tick.
    await persistAll()
    return { ok: true, revealed: undefined, meta: memory.meta, done: false }
  }
  // revealCell already persisted the state (including updated meta version/etag)
  return { ok: true, revealed: res.cell, meta: res.meta, done: false }
}
