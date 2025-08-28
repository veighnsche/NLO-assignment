import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useGridHoverTooltip } from '../useGridHoverTooltip'
import type { GridTooltipApi } from '../useGridTooltip'

function makeButton(idx?: string) {
  const btn = document.createElement('button')
  btn.className = 'cell'
  if (idx != null) btn.setAttribute('data-index', idx)
  return btn
}

describe('useGridHoverTooltip', () => {
  let tooltip: { api: GridTooltipApi; get: () => GridTooltipApi }
  beforeEach(() => {
    vi.spyOn(globalThis, 'requestAnimationFrame' as any).mockImplementation(
      (cb: FrameRequestCallback) => {
        // run immediately
        cb(0)
        return 1 as any
      },
    )
    const api: GridTooltipApi = {
      hover: vi.fn(),
      move: vi.fn(),
      leave: vi.fn(),
    }
    tooltip = { api, get: () => api }
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls hover with computed payload when moving over a valid cell', () => {
    const revealedById = ref(new Map<string, any>())
    const { onGridMove } = useGridHoverTooltip({
      getTooltip: () => tooltip.get(),
      getRow: (i) => Math.floor(i / 100) + 1,
      getCol: (i) => (i % 100) + 1,
      cellIdFromIndex: (i) => `c-${i}`,
      revealedById,
      userNameById: (id) => (id ? `User ${id}` : null),
    })

    // Prepare target
    const btn = makeButton('101') // row 2, col 2
    const e = new MouseEvent('mousemove', { clientX: 10, clientY: 20 })
    Object.defineProperty(e, 'target', { value: btn })

    onGridMove(e)

    expect(tooltip.api.hover).toHaveBeenCalled()
    const payload = (tooltip.api.hover as any).mock.calls[0][0]
    expect(payload.text).toContain('Rij 2, Kolom 2')
    expect(payload.x).toBe(10)
    expect(payload.y).toBe(20)
    expect(payload.revealed).toBe(false)
  })

  it('updates with opener/prize when cell is revealed', () => {
    const revealedById = ref(
      new Map<string, any>([
        [
          'c-0',
          {
            revealed: true,
            revealedBy: 'u1',
            prize: { type: 'consolation', amount: 100 },
            revealedAt: '2024-01-02T03:04:05Z',
          },
        ],
      ]),
    )
    const { onGridMove } = useGridHoverTooltip({
      getTooltip: () => tooltip.get(),
      getRow: () => 1,
      getCol: () => 1,
      cellIdFromIndex: () => 'c-0',
      revealedById,
      userNameById: (id) => (id ? `User ${id}` : null),
    })

    const btn = makeButton('0')
    const e = new MouseEvent('mousemove', { clientX: 5, clientY: 6 })
    Object.defineProperty(e, 'target', { value: btn })

    onGridMove(e)

    const payload = (tooltip.api.hover as any).mock.calls[0][0]
    expect(payload.opener).toBe('User u1')
    expect(payload.revealed).toBe(true)
    expect(payload.prizeType).toBe('consolation')
    expect(payload.prizeAmount).toBe(100)
    expect(payload.revealedAt).toBe('2024-01-02T03:04:05Z')
  })

  it('leaves tooltip when moving off cells or invalid index', () => {
    const revealedById = ref(new Map<string, any>())
    const { onGridMove, onGridLeave } = useGridHoverTooltip({
      getTooltip: () => tooltip.get(),
      getRow: () => 1,
      getCol: () => 1,
      cellIdFromIndex: () => 'c-x',
      revealedById,
      userNameById: () => null,
    })

    // No button target
    const e1 = new MouseEvent('mousemove', { clientX: 0, clientY: 0 })
    Object.defineProperty(e1, 'target', { value: document.createElement('div') })
    onGridMove(e1)

    // Invalid index
    const btnBad = makeButton('NaN')
    const e2 = new MouseEvent('mousemove', { clientX: 0, clientY: 0 })
    Object.defineProperty(e2, 'target', { value: btnBad })
    onGridMove(e2)

    expect(tooltip.api.leave).toHaveBeenCalled()

    // Explicit leave
    onGridLeave()
    expect(tooltip.api.leave).toHaveBeenCalled()
  })
})
