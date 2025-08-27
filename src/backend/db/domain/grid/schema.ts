// Core types and helpers for the GRID DB layer

export type CellId = string // format: r{row}-c{col}

export type PrizeType = 'none' | 'consolation' | 'grand'

export interface Prize {
  type: PrizeType
  amount: 0 | 100 | 25000
}

export interface Cell {
  id: CellId
  row: number // 0..99
  col: number // 0..99
  revealed: boolean
  prize?: Prize // present only if revealed
  revealedBy?: string // optional, for later
  revealedAt?: string // ISO time at reveal
}

export interface GridMeta {
  version: number
  etag: string
  seed?: number
  /**
   * Deterministic reveal sequence for simulated players.
   * Created at seed time via a Fisher–Yates shuffle over all cell ids.
   */
  revealOrder?: CellId[]
  /**
   * Cursor into `revealOrder`. Bots advance this while choosing next cells,
   * skipping entries already revealed by any player.
   */
  revealIndex?: number
  /**
   * Optional turn gating: when set, only this playerId (or the bot) is allowed
   * to perform a reveal. Admin can clear it to allow any eligible player.
   */
  currentPlayerId?: string
}

export interface GridState {
  cells: Record<CellId, Cell>
  meta: GridMeta
}

export const GRID_ROWS = 100
export const GRID_COLS = 100
export const GRID_TOTAL = GRID_ROWS * GRID_COLS // 10_000

export function cellId(row: number, col: number): CellId {
  return `r${row}-c${col}`
}

export function makeEtag(version: number): string {
  return `v-${version}`
}

export const PrizeNone: Prize = { type: 'none', amount: 0 }
export const PrizeConsolation: Prize = { type: 'consolation', amount: 100 }
export const PrizeGrand: Prize = { type: 'grand', amount: 25000 }
