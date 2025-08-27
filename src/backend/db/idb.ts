import { openDB, type IDBPDatabase } from 'idb'
import type { Cell, CellId, GridState, GridMeta, Prize } from './schema'
import { GRID_COLS, GRID_ROWS, GRID_TOTAL, PrizeNone, makeEtag } from './schema'
import { seedGrid, type Targets, getNextBotReveal } from './seed'

// DB constants
const DB_NAME = 'nlo-db'
const DB_VERSION = 1
const STORE_GRID = 'grid'
const STORE_META = 'meta'

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
  const tx = database.transaction([STORE_GRID, STORE_META], 'readwrite')
  await Promise.all([
    tx.objectStore(STORE_GRID).put(memory!.cells, 'grid'),
    tx.objectStore(STORE_META).put(memory!.meta, 'meta'),
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
  const tx = database.transaction([STORE_GRID, STORE_META], 'readonly')
  const storedCells = (await tx.objectStore(STORE_GRID).get('grid')) as
    | Record<CellId, Cell>
    | undefined
  const storedMeta = (await tx.objectStore(STORE_META).get('meta')) as GridMeta | undefined
  await tx.done

  if (storedCells && storedMeta) {
    // Load into memory and reseed hidden targets deterministically from meta.seed
    memory = { cells: storedCells, meta: storedMeta }
    reseedTargetsFromSeed(storedMeta.seed)
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
  const txw = database.transaction([STORE_GRID, STORE_META], 'readwrite')
  await Promise.all([
    txw.objectStore(STORE_GRID).put(state.cells, 'grid'),
    txw.objectStore(STORE_META).put(state.meta, 'meta'),
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
  | { error: 'NOT_FOUND' | 'ALREADY_REVEALED' | 'ALREADY_PLAYED' }
> {
  ensureBooted(memory)
  // Enforce one reveal per player
  if (playerId) {
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
