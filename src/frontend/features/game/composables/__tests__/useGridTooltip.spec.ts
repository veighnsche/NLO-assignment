import { describe, expect, it } from 'vitest'
import { useGridTooltip } from '../useGridTooltip'

describe('useGridTooltip', () => {
  it('onHover populates state and opens tooltip; derived props reflect payload', () => {
    const t = useGridTooltip()

    t.onHover({
      text: 'Rij 1, Kolom 2',
      x: 10,
      y: 20,
      opener: 'Alice',
      revealed: true,
      prizeType: 'consolation',
      prizeAmount: 100,
      revealedAt: '2024-01-02T03:04:05Z',
    })

    expect(t.open.value).toBe(true)
    expect(t.text.value).toBe('Rij 1, Kolom 2')
    expect(t.x.value).toBe(10)
    expect(t.y.value).toBe(20)
    expect(t.opener.value).toBe('Alice')
    expect(t.revealed.value).toBe(true)
    expect(t.prizeLabel.value).toBe('Troostprijs')
    expect(t.prizeClass.value).toBe('prize--consolation')
    expect(t.statusClass.value).toBe('status--open')
    expect(t.prizeAmountText.value).toContain('100')
    expect(t.whenText.value).not.toBeNull()
  })

  it('onMove only updates coordinates when open; onLeave closes tooltip', () => {
    const t = useGridTooltip()
    // closed -> no move effect
    t.onMove(1, 2)
    expect(t.x.value).toBe(0)
    expect(t.y.value).toBe(0)

    // open and then move
    t.onHover({ text: 't', x: 0, y: 0, opener: null, revealed: false })
    t.onMove(50, 60)
    expect(t.x.value).toBe(50)
    expect(t.y.value).toBe(60)

    // leave closes
    t.onLeave()
    expect(t.open.value).toBe(false)
  })
})
