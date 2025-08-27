import { describe, it, expect } from 'vitest'
import { seedGrid, getNextBotReveal } from '@/backend/db/domain/grid/seed'
import { GRID_TOTAL, PrizeConsolation, PrizeGrand } from '@/backend/db/domain/grid/schema'
import type { Targets } from '@/backend/db/domain/grid/seed'

function countPrizes(targets: Targets) {
  let grand = 0
  let consolation = 0
  for (const prize of Object.values(targets)) {
    if (prize.amount === PrizeGrand.amount) grand++
    else if (prize.amount === PrizeConsolation.amount) consolation++
  }
  return { grand, consolation }
}

describe('seedGrid', () => {
  it('is deterministic for the same seed (state meta, revealOrder, and targets)', () => {
    const seed = 2025
    const a = seedGrid(undefined, undefined, seed)
    const b = seedGrid(undefined, undefined, seed)

    // reveal order identical
    expect(a.state.meta.revealOrder).toEqual(b.state.meta.revealOrder)
    // meta basic fields
    expect(a.state.meta.version).toBe(1)
    expect(a.state.meta.etag).toBe('v-1')
    expect(a.state.meta.seed).toBe(seed)
    expect(b.state.meta.seed).toBe(seed)

    // targets identical
    expect(a.targets).toEqual(b.targets)

    // cells count
    expect(Object.keys(a.state.cells).length).toBe(GRID_TOTAL)
  })

  it('places exactly 1 grand prize and up to 100 consolations', () => {
    const { targets } = seedGrid()
    const { grand, consolation } = countPrizes(targets)
    expect(grand).toBe(1)
    expect(consolation).toBeLessThanOrEqual(100)
    // For default 100x100 grid we expect exactly 100 consolation
    expect(consolation).toBe(100)
  })
})

describe('getNextBotReveal', () => {
  it('progresses through revealOrder and advances index', () => {
    const { state } = seedGrid(undefined, undefined, 123)

    // 1st
    let step = getNextBotReveal(state)
    const first = state.meta.revealOrder![0]
    expect(step.id).toBe(first)
    expect(step.index).toBe(1)
    // simulate applying reveal and persisting index
    state.cells[first].revealed = true
    state.meta.revealIndex = step.index

    // 2nd
    step = getNextBotReveal(state)
    const second = state.meta.revealOrder![1]
    expect(step.id).toBe(second)
    expect(step.index).toBe(2)
    state.cells[second].revealed = true
    state.meta.revealIndex = step.index
  })

  it('skips cells that are already revealed', () => {
    const { state } = seedGrid(undefined, undefined, 456)
    const order = state.meta.revealOrder!

    // Mark the next two unrevealed entries as revealed pre-emptively
    state.cells[order[0]].revealed = true
    state.cells[order[1]].revealed = true
    state.meta.revealIndex = 0

    const step = getNextBotReveal(state)
    expect(step.id).toBe(order[2])
    expect(step.index).toBe(3)
  })
})
