import { describe, expect, it } from 'vitest'
import { clampHz, hzToIntervalMs, intervalToHz, intervalWindow, MIN_HZ, MAX_HZ } from '../botSpeed'

describe('botSpeed utilities', () => {
  it('clampHz bounds values and handles non-finite', () => {
    expect(clampHz(0)).toBe(MIN_HZ)
    expect(clampHz(100)).toBe(MAX_HZ)
    expect(clampHz(NaN as any)).toBe(MIN_HZ)
    expect(clampHz(Infinity as any)).toBe(MIN_HZ)
  })

  it('hzToIntervalMs converts frequency to interval (>=100ms)', () => {
    expect(hzToIntervalMs(1)).toBe(1000)
    expect(hzToIntervalMs(10)).toBeGreaterThanOrEqual(100)
  })

  it('intervalToHz converts ms to frequency', () => {
    expect(intervalToHz(1000)).toBeCloseTo(1, 5)
    expect(intervalToHz(200)).toBeCloseTo(5, 5)
  })

  it('intervalWindow derives min/max around base and keeps max>=min', () => {
    const w = intervalWindow(1000)
    expect(w.minMs).toBeGreaterThan(0)
    expect(w.maxMs).toBeGreaterThanOrEqual(w.minMs)
  })
})
