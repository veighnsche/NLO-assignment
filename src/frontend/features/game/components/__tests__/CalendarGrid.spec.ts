import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import CalendarGrid from '../CalendarGrid.vue'

vi.mock('@iconify/vue', () => ({
  Icon: { name: 'Icon', template: '<i />' },
}))

// Mock heavy composables to a tiny grid
vi.mock('@/frontend/features/game/composables/useGridCells', () => {
  const cells = [0, 1, 2]
  const revealed = new Set<number>([1])
  return {
    useGridCells: () => ({
      cells,
      grid: {
        reveal: vi.fn(),
        revealed: [{ id: '1', prize: { type: 'consolation' } }],
        userHasRevealed: () => false,
      },
      revealedById: new Map<string, any>(),
      getRow: (i: number) => i + 1,
      getCol: (i: number) => i + 1,
      cellIdFromIndex: (i: number) => String(i),
      isRevealed: (i: number) => revealed.has(i),
      isExposed: () => false,
      cellPrize: (i: number) => (i === 1 ? { type: 'consolation' } : { type: 'none' }),
      cellPrizeType: (i: number) => (i === 1 ? 'consolation' : 'none'),
      exposedPrizeType: () => 'none',
      isCellDisabled: () => false,
      ariaLabelForCell: (i: number) => `Cel ${i}`,
    }),
  }
})

vi.mock('@/frontend/features/game/composables/useGridHoverTooltip', () => {
  return {
    useGridHoverTooltip: () => ({
      onGridMove: () => {},
      onGridLeave: () => {},
    }),
  }
})

vi.mock('@/frontend/features/game/store/status', () => ({
  useStatusStore: () => ({ isRevealing: false }),
}))
vi.mock('@/frontend/features/game/store/session', () => ({
  useSessionStore: () => ({ userNameById: () => 'Test' }),
}))

describe('CalendarGrid.vue', () => {
  it('renders a small grid and responds to click', async () => {
    const wrapper = mount(CalendarGrid, {
      props: { confirmBeforeReveal: false },
    })
    // Should render 3 cells
    const buttons = wrapper.findAll('button.cell')
    expect(buttons.length).toBe(3)
    // Revealed cell has class
    expect(buttons[1].classes()).toContain('revealed')
    // Click closed playable cell
    await buttons[0].trigger('click')
  })

  it('sets aria-labels and classes as expected', () => {
    const wrapper = mount(CalendarGrid, {
      props: { confirmBeforeReveal: false },
    })
    const buttons = wrapper.findAll('button.cell')
    // aria label from mocked composable
    expect(buttons[0].attributes('aria-label')).toBe('Cel 0')
    expect(buttons[1].attributes('aria-label')).toBe('Cel 1')
    // revealed cell has class, others not
    expect(buttons[1].classes()).toContain('revealed')
    expect(buttons[0].classes()).not.toContain('revealed')
  })
})
