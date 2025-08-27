import { describe, it, expect, vi } from 'vitest'
import { sleep, randomInt } from '@/backend/infra/util'
import { createXorShift32 } from '@/backend/domain/shared/rng'

describe('infra/util.sleep', () => {
  it('resolves after the specified milliseconds (with fake timers)', async () => {
    vi.useFakeTimers()
    const spy = vi.fn()

    const p = sleep(100).then(spy)

    // Not resolved yet
    expect(spy).not.toHaveBeenCalled()

    // advance time
    vi.advanceTimersByTime(100)
    await vi.runAllTicks()

    expect(spy).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
    await p
  })
})

describe('infra/util.randomInt', () => {
  it('returns inclusive integers within [min, max]', () => {
    const rng = createXorShift32(123)
    const min = 3
    const max = 7
    for (let i = 0; i < 1000; i++) {
      const v = randomInt(min, max, rng)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(min)
      expect(v).toBeLessThanOrEqual(max)
    }
  })

  it('works when min > max by swapping internally', () => {
    const rng = createXorShift32(42)
    for (let i = 0; i < 100; i++) {
      const v = randomInt(10, 5, rng)
      expect(v).toBeGreaterThanOrEqual(5)
      expect(v).toBeLessThanOrEqual(10)
    }
  })

  it('accepts an RNG object with nextFloat()', () => {
    const rng = createXorShift32(999)
    const values = new Set<number>()
    for (let i = 0; i < 50; i++) values.add(randomInt(0, 2, rng))
    // should have at least two possible values in small range
    expect(values.size).toBeGreaterThanOrEqual(2)
  })

  it('accepts an RNG function()', () => {
    // deterministic function returning 0.5
    const fn = () => 0.5
    // With r=0.5 and range [0, 9] => floor(0.5 * 10) + 0 = 5
    expect(randomInt(0, 9, fn)).toBe(5)
  })

  it('uses Math.random() when rng omitted (mocked)', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.9999)
    // inclusive upper bound should allow returning max
    const v = randomInt(1, 3)
    expect(v).toBe(3)
    spy.mockRestore()
  })
})
