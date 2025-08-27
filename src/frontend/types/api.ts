// Shared client-side representations (mirroring backend schema)
export type PrizeType = 'none' | 'consolation' | 'grand'

export interface Prize {
  type: PrizeType
  amount: 0 | 100 | 25000
}

export interface Cell {
  id: string
  row: number
  col: number
  revealed: boolean
  prize?: Prize
  revealedBy?: string
  revealedAt?: string
}

export interface GridMeta {
  version: number
  etag: string
  seed?: number
}

export interface Snapshot {
  meta: {
    version: number
    etag: string
  }
  revealed: Cell[]
  openedCount: number
  total: number
}

// Response types mirroring backend contracts
export type RevealResponse =
  | { ok: true; cell: Cell; meta: GridMeta }
  | {
      error:
        | 'NOT_FOUND'
        | 'ALREADY_REVEALED'
        | 'ALREADY_PLAYED'
        | 'NOT_YOUR_TURN'
        | 'NOT_ELIGIBLE'
    }

export type BotStepResponse =
  | { ok: true; revealed?: Cell; meta: GridMeta; done: boolean }
  | { error: 'NOT_BOOTED' }

export interface AdminResetResponse {
  ok: true
  meta: GridMeta
}

// Centralized reveal result type used by UI components
export type RevealResult = {
  type: PrizeType
  amount: Prize['amount']
}
