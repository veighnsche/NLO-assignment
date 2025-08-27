import { describe, it, expect } from 'vitest'
import {
  GRID_ROWS,
  GRID_COLS,
  GRID_TOTAL,
  cellId,
  makeEtag,
  PrizeNone,
  PrizeConsolation,
  PrizeGrand,
} from '@/backend/domain/grid/schema'

describe('domain/grid/schema constants', () => {
  it('GRID_TOTAL equals GRID_ROWS * GRID_COLS', () => {
    expect(GRID_TOTAL).toBe(GRID_ROWS * GRID_COLS)
  })

  it('prize constants are consistent', () => {
    expect(PrizeNone).toEqual({ type: 'none', amount: 0 })
    expect(PrizeConsolation).toEqual({ type: 'consolation', amount: 100 })
    expect(PrizeGrand).toEqual({ type: 'grand', amount: 25000 })
  })
})

describe('domain/grid/schema helpers', () => {
  it('cellId formats as r{row}-c{col}', () => {
    expect(cellId(0, 0)).toBe('r0-c0')
    expect(cellId(12, 34)).toBe('r12-c34')
  })

  it('makeEtag returns v-{version}', () => {
    expect(makeEtag(1)).toBe('v-1')
    expect(makeEtag(42)).toBe('v-42')
  })
})
