import { openDB, type IDBPDatabase } from 'idb'
import type { Cell, CellId, GridState, GridMeta, Prize } from './schema'
import { GRID_COLS, GRID_ROWS, GRID_TOTAL, PrizeNone, makeEtag } from './schema'
import { seedGrid, type Targets, getNextBotReveal } from './seed'
import { mixSeedWithString } from './rng'
import { generateUsers, indexUsers, type User } from './users'

// DB constants
const DB_NAME = 'nlo-db'
const DB_VERSION = 2
const STORE_GRID = 'grid'
const STORE_META = 'meta'
const STORE_USERS = 'users'

// Simulated backend delay for bot actions (in milliseconds)
let BOT_DELAY_MIN_MS = 300
let BOT_DELAY_MAX_MS = 1500

export function setBotDelayRange(minMs: number, maxMs: number): void {
  // Ensure sane values and ordering
  const min = Math.max(0, Math.floor(minMs))
  const max = Math.max(min, Math.floor(maxMs))
  BOT_DELAY_MIN_MS = min
  BOT_DELAY_MAX_MS = max
}

export function getBotDelayRange(): { minMs: number; maxMs: number } {
  return { minMs: BOT_DELAY_MIN_MS, maxMs: BOT_DELAY_MAX_MS }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomInt(min: number, max: number): number {
  // inclusive min, inclusive max
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Runtime in-memory snapshot and hidden targets
let db: IDBPDatabase | null = null
let memory: GridState | null = null
let targets: Targets = {}
let usersMemory: Record<string, User> | null = null

// --- Internal helpers ---
async function getDb(): Promise<IDBPDatabase> {
  if (db) return db
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_GRID)) {
        database.createObjectStore(STORE_GRID)
      }
      if (!database.objectStoreNames.contains(STORE_META)) {
        database.createObjectStore(STORE_META)
      }
      if (!database.objectStoreNames.contains(STORE_USERS)) {
        database.createObjectStore(STORE_USERS)
      }
    },
  })
  return db
}

function ensureBooted(m: GridState | null): asserts m is GridState {
  if (!m) {
    throw new Error('Database not booted. Call bootDatabase() first.')
  }
}

async function persistAll(): Promise<void> {
  ensureBooted(memory)
  const database = await getDb()
  const tx = database.transaction([STORE_GRID, STORE_META, STORE_USERS], 'readwrite')
  await Promise.all([
    tx.objectStore(STORE_GRID).put(memory!.cells, 'grid'),
    tx.objectStore(STORE_META).put(memory!.meta, 'meta'),
    usersMemory ? tx.objectStore(STORE_USERS).put(usersMemory, 'users') : Promise.resolve(),
  ])
  await tx.done
}

function bumpVersion(): void {
  ensureBooted(memory)
  memory!.meta.version += 1
  memory!.meta.etag = makeEtag(memory!.meta.version)
}

function reseedTargetsFromSeed(seed?: number): void {
  // Use seedGrid only to derive targets deterministically; discard the generated state
  const { targets: t } = seedGrid(GRID_ROWS, GRID_COLS, seed)
  targets = t
}

// --- Public API ---
export async function bootDatabase(seed?: number): Promise<void> {
  const database = await getDb()
  const tx = database.transaction([STORE_GRID, STORE_META, STORE_USERS], 'readonly')
  const storedCells = (await tx.objectStore(STORE_GRID).get('grid')) as
    | Record<CellId, Cell>
    | undefined
  const storedMeta = (await tx.objectStore(STORE_META).get('meta')) as GridMeta | undefined
  const storedUsers = (await tx.objectStore(STORE_USERS).get('users')) as
    | Record<string, User>
    | undefined
  await tx.done

  if (storedCells && storedMeta) {
    // Load into memory and reseed hidden targets deterministically from meta.seed
    memory = { cells: storedCells, meta: storedMeta }
    reseedTargetsFromSeed(storedMeta.seed)
    // Users: load or generate once
    if (storedUsers) {
      usersMemory = storedUsers
    } else {
      const s = typeof storedMeta.seed === 'number' ? storedMeta.seed : 0x9e3779b9
      const users = generateUsers(GRID_TOTAL, s)
      usersMemory = indexUsers(users)
      const txw = database.transaction([STORE_USERS], 'readwrite')
      await txw.objectStore(STORE_USERS).put(usersMemory, 'users')
      await txw.done
    }
    // Backfill deterministic bot order if missing (older metas)
    if (!memory.meta.revealOrder || typeof memory.meta.revealIndex !== 'number') {
      const { state: seeded } = seedGrid(GRID_ROWS, GRID_COLS, storedMeta.seed)
      memory.meta.revealOrder = seeded.meta.revealOrder
      memory.meta.revealIndex = 0
      await persistAll()
    }
    return
  }

  // Nothing in DB: seed fresh grid
  const { state, targets: t } = seedGrid(GRID_ROWS, GRID_COLS, seed)
  memory = state
  targets = t
  // Generate users deterministically from the same seed
  const s = typeof seed === 'number' ? seed : 0x9e3779b9
  const users = generateUsers(GRID_TOTAL, s)
  usersMemory = indexUsers(users)
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
  ensureBooted(memory)
  const revealed = Object.values(memory!.cells).filter((c) => c.revealed)
  return {
    meta: { version: memory!.meta.version, etag: memory!.meta.etag },
    revealed,
    openedCount: revealed.length,
    total: GRID_TOTAL,
  }
}

/** Admin-only: return hidden target cells without modifying reveal state. */
export function getAdminTargets(): Array<{ id: CellId; row: number; col: number; prize: Prize }> {
  ensureBooted(memory)
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
): Promise<
  | { ok: true; cell: Cell; meta: GridMeta }
  | { error: 'NOT_FOUND' | 'ALREADY_REVEALED' | 'ALREADY_PLAYED' | 'NOT_YOUR_TURN' | 'NOT_ELIGIBLE' }
> {
  ensureBooted(memory)
  // Enforce one reveal per player (except for the deterministic bot)
  if (playerId && playerId !== 'bot') {
    // Turn gating if currentPlayerId is set
    const current = memory!.meta.currentPlayerId
    if (current && playerId !== current) {
      return { error: 'NOT_YOUR_TURN' }
    }
    // Ensure users are loaded
    if (!usersMemory) {
      throw new Error('Users not initialized')
    }
    const user = usersMemory[playerId]
    if (!user) return { error: 'NOT_ELIGIBLE' }
    if (user.played) return { error: 'ALREADY_PLAYED' }
    const already = Object.values(memory!.cells).some((c) => c.revealedBy === playerId)
    if (already) {
      return { error: 'ALREADY_PLAYED' }
    }
  }
  const cell = memory!.cells[id]
  if (!cell) return { error: 'NOT_FOUND' }
  if (cell.revealed) return { error: 'ALREADY_REVEALED' }

  // Determine prize from hidden targets; default to none
  const prize: Prize = targets[id] ?? PrizeNone

  // Mutate in-memory state
  cell.revealed = true
  cell.prize = prize
  if (playerId) cell.revealedBy = playerId
  cell.revealedAt = new Date().toISOString()

  // Mark user as played when applicable
  if (playerId && playerId !== 'bot' && usersMemory) {
    const u = usersMemory[playerId]
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
  memory = state
  targets = t
  // Regenerate users deterministically on reset
  const s = typeof seed === 'number' ? seed : 0x9e3779b9
  const users = generateUsers(GRID_TOTAL, s)
  usersMemory = indexUsers(users)
  await persistAll()
  return { ok: true, meta: memory!.meta }
}

/**
 * Perform a single bot step deterministically.
 * Frontend can poll this periodically (e.g., setInterval) to simulate concurrent players.
 *
 * Returns the revealed cell if any, current meta, and a done flag if no cells are left.
 */
export async function botStep(): Promise<
  { ok: true; revealed?: Cell; meta: GridMeta; done: boolean } | { error: 'NOT_BOOTED' }
> {
  if (!memory) return { error: 'NOT_BOOTED' }
  // Randomized backend-side delay to simulate realistic server/bot timing
  await sleep(randomInt(BOT_DELAY_MIN_MS, BOT_DELAY_MAX_MS))
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

  // Reveal chosen cell as bot
  const res = await revealCell(id, 'bot')
  if ('error' in res) {
    // In case of a race where the cell got revealed between selection and reveal,
    // just persist meta and return done=false to try again on next tick.
    await persistAll()
    return { ok: true, revealed: undefined, meta: memory.meta, done: false }
  }
  // revealCell already persisted the state (including updated meta version/etag)
  return { ok: true, revealed: res.cell, meta: res.meta, done: false }
}

// --- Users API ---

export function getCurrentPlayer(): { currentPlayerId?: string } {
  ensureBooted(memory)
  return { currentPlayerId: memory!.meta.currentPlayerId }
}

export async function setCurrentPlayer(playerId: string | null): Promise<{ ok: true } | { error: 'NOT_ELIGIBLE' }> {
  ensureBooted(memory)
  if (playerId) {
    if (!usersMemory || !usersMemory[playerId] || usersMemory[playerId].played) {
      return { error: 'NOT_ELIGIBLE' }
    }
    memory!.meta.currentPlayerId = playerId
  } else {
    delete memory!.meta.currentPlayerId
  }
  bumpVersion()
  await persistAll()
  return { ok: true }
}

export function listEligibleUsers(
  offset = 0,
  limit = 100,
  query?: string,
): { total: number; users: Array<{ id: string; name: string }> } {
  if (!usersMemory) return { total: 0, users: [] }
  const all = Object.values(usersMemory).filter((u) => !u.played)
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
  ensureBooted(memory)
  if (!usersMemory) throw new Error('Users not initialized')
  // Deterministic mapping using shared RNG helper: mix meta.seed with clientId
  const baseSeed = (memory!.meta.seed ?? 0x9e3779b9) | 0
  const rng = mixSeedWithString(baseSeed, clientId)
  const ids = Object.keys(usersMemory)
  const idx = rng.nextInt(ids.length)
  const uid = ids[idx]
  const u = usersMemory[uid]
  return { id: u.id, name: u.name }
}

export function resolveUsers(ids: string[]): Array<{ id: string; name: string }> {
  if (!usersMemory) return []
  const out: Array<{ id: string; name: string }> = []
  for (const id of ids) {
    const u = usersMemory[id]
    if (u) out.push({ id: u.id, name: u.name })
  }
  return out
}
