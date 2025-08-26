import {
  GRID_COLS,
  GRID_ROWS,
  GRID_TOTAL,
  PrizeConsolation,
  PrizeGrand,
  cellId,
  makeEtag,
  type Cell,
  type CellId,
  type GridMeta,
  type GridState,
  type Prize,
} from './schema'
import { createXorShift32, shuffleInPlace } from './rng'

/**
 * Mapping from cell id to hidden prize for targeted cells only.
 * Non-target cells are omitted to keep the structure compact and explicit.
 */
export type Targets = Record<CellId, Prize> // only contains grand/consolation targeted cells

/**
 * Result of seeding: initial grid state plus the hidden targets.
 */
export interface SeedResult {
  state: GridState
  targets: Targets
}

/**
 * Seed logic: constructs an unrevealed grid and deterministically selects hidden prize targets.
 *
 * Determinism:
 * - Given the same `rows`, `cols`, and `seed`, this will always produce the same
 *   target placement because it uses `createXorShift32(seed)` and a Fisher–Yates shuffle.
 *
 * Targeting policy:
 * - 1 grand prize: first id after shuffling.
 * - Up to 100 consolation prizes: the next 100 ids after the grand prize, skipping duplicates.
 *
 * @param rows Number of grid rows (default `GRID_ROWS`).
 * @param cols Number of grid columns (default `GRID_COLS`).
 * @param seed Optional numeric seed. If omitted, a fixed non-zero default is used.
 * @returns Seeded grid state and the mapping of targeted cells to prizes.
 */
export function seedGrid(rows = GRID_ROWS, cols = GRID_COLS, seed?: number): SeedResult {
  // Build cells map with all cells unrevealed and without any prize attached.
  const cells: Record<CellId, Cell> = {}
  const allIds: CellId[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = cellId(r, c)
      allIds.push(id)
      cells[id] = {
        id,
        row: r,
        col: c,
        revealed: false,
      }
    }
  }

  // Determine targets and reveal order using deterministic RNGs but independent shuffles
  // so that bot reveal sequence is not correlated with prize placement.
  const s = typeof seed === 'number' ? seed : 0x9e3779b9 // default non-zero seed
  const rngTargets = createXorShift32(s)
  const rngReveal = createXorShift32((s ^ 0xa5a5a5a5) | 0)

  // Create independent arrays for shuffling
  const idsForTargets = allIds.slice()
  const idsForReveal = allIds.slice()

  // Shuffle for target selection (grand + consolation positions)
  shuffleInPlace(idsForTargets, rngTargets)
  // Shuffle independently for deterministic bot reveal order
  shuffleInPlace(idsForReveal, rngReveal)
  const revealOrder: CellId[] = idsForReveal

  const targets: Targets = {}
  if (allIds.length !== GRID_TOTAL) {
    // Defensive: ensure consistent total
    // but proceed anyway using available length
  }

  if (idsForTargets.length > 0) {
    const grandId = idsForTargets[0]
    targets[grandId] = PrizeGrand
  }
  // Cap consolation targets to 100 or fewer if the grid is very small.
  const consolationCount = Math.min(100, Math.max(0, idsForTargets.length - 1))
  for (let i = 1; i <= consolationCount; i++) {
    const id = idsForTargets[i]
    if (!targets[id]) {
      targets[id] = PrizeConsolation
    }
  }

  const meta: GridMeta = {
    version: 1,
    etag: makeEtag(1),
    seed, // store the input seed (may be undefined) for traceability
    revealOrder,
    revealIndex: 0,
  }

  const state: GridState = {
    cells,
    meta,
  }

  return { state, targets }
}

/**
 * Get the next bot reveal deterministically from `meta.revealOrder`, skipping any
 * cells already revealed by any player. Returns the chosen id (if any) and the
 * next index the caller should persist into `meta.revealIndex`.
 *
 * This function does not mutate the state; the caller should update
 * `state.meta.revealIndex = result.index` and then apply the reveal.
 */
export function getNextBotReveal(state: GridState): { id?: CellId; index: number } {
  const order = state.meta.revealOrder ?? []
  const start = Math.max(0, state.meta.revealIndex ?? 0)
  let i = start
  while (i < order.length) {
    const id = order[i]
    const cell = state.cells[id]
    i++
    if (!cell?.revealed) {
      return { id, index: i }
    }
  }
  return { id: undefined, index: i }
}
