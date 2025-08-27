import { describe, it, expect } from 'vitest'
import { getBotDelayRange, setBotDelayRange } from '@/backend/services/bot.service'

describe('services/bot.service', () => {
  it('returns default delay range initially', () => {
    const r = getBotDelayRange()
    expect(r.minMs).toBeGreaterThanOrEqual(0)
    expect(r.minMs).toBe(300)
    expect(r.maxMs).toBe(1500)
  })

  it('setBotDelayRange floors, clamps negative to 0, and ensures max >= min', () => {
    setBotDelayRange(-10.7, 999.9)
    let r = getBotDelayRange()
    expect(r.minMs).toBe(0)
    expect(r.maxMs).toBe(999)

    // max lower than min: max should be raised to min
    setBotDelayRange(123.4, 10.2)
    r = getBotDelayRange()
    expect(r.minMs).toBe(123)
    expect(r.maxMs).toBe(123)
  })

  it('can set and read back an arbitrary valid range', () => {
    setBotDelayRange(5, 6)
    const r = getBotDelayRange()
    expect(r).toEqual({ minMs: 5, maxMs: 6 })
  })
})
