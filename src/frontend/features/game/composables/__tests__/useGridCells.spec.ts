import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGridCells } from '../useGridCells'

// Hoisted mutable mocks so composable reads live state
const gridMock = {
  revealedSet: new Set<string>(),
  revealedById: new Map<string, { prize?: { type?: 'grand' | 'consolation' } }>(),
  userHasRevealed: () => false,
}
const exposedMock = {
  exposedSet: new Set<string>(),
  targets: [] as Array<{ id: string; prize?: { type?: 'grand' | 'consolation' } }>,
}
const statusMock = { isRevealing: false }
const adminUiMock = { showExposed: true }

vi.mock('@/frontend/features/game/store/grid', () => ({ useGridStore: () => gridMock }))
vi.mock('@/frontend/features/admin/store/exposed', () => ({ useExposedStore: () => exposedMock }))
vi.mock('@/frontend/features/game/store/status', () => ({ useStatusStore: () => statusMock }))
vi.mock('@/frontend/features/admin/store/adminUI', () => ({ useAdminUiStore: () => adminUiMock }))

function id(r: number, c: number) {
  return `r${r}-c${c}`
}

describe('useGridCells', () => {
  beforeEach(() => {
    gridMock.revealedSet = new Set<string>([id(0, 1)])
    gridMock.revealedById = new Map()
    gridMock.userHasRevealed = () => false
    exposedMock.exposedSet = new Set<string>([id(0, 2)])
    exposedMock.targets = [{ id: id(0, 2), prize: { type: 'consolation' } }]
    statusMock.isRevealing = false
    adminUiMock.showExposed = true
  })

  it('computes cell ids, revealed/exposed flags, and aria for closed playable cells', () => {
    const c = useGridCells(1, 3)
    expect(c.cellIdFromIndex(0)).toBe(id(0, 0))
    expect(c.getRow(2)).toBe(0)
    expect(c.getCol(2)).toBe(2)

    expect(c.isRevealed(1)).toBe(true)
    expect(c.isExposed(2)).toBe(true)

    // Closed and playable (not revealed, not disabled)
    expect(c.ariaLabelForCell(0)).toBe('Gesloten vakje (speelbaar)')
  })

  it('produces aria for revealed prizes and disabled state', () => {
    // Add revealed prize types
    gridMock.revealedById.set(id(0, 1), { prize: { type: 'consolation' } })
    const c1 = useGridCells(1, 3)
    expect(c1.ariaLabelForCell(1)).toBe('Geopend vakje (Troostprijs)')

    // Change to grand and verify
    gridMock.revealedById.set(id(0, 1), { prize: { type: 'grand' } })
    const c2 = useGridCells(1, 3)
    expect(c2.ariaLabelForCell(1)).toBe('Geopend vakje (Hoofdprijs)')

    // Disabled closed cell when revealing
    statusMock.isRevealing = true
    const c3 = useGridCells(1, 3)
    expect(c3.ariaLabelForCell(0)).toBe('Gesloten vakje (niet speelbaar)')
  })
})
