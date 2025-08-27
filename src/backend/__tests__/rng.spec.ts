import { describe, it, expect } from 'vitest'
import { createXorShift32, shuffleInPlace } from '@/backend/domain/shared/rng'

function genSequenceUInt32(seed: number, n: number): number[] {
  const rng = createXorShift32(seed)
  const out: number[] = []
  for (let i = 0; i < n; i++) out.push(rng.nextUint32())
  return out
}

describe('createXorShift32', () => {
  it('produces deterministic sequences for the same seed', () => {
    const a = genSequenceUInt32(123456789, 10)
    const b = genSequenceUInt32(123456789, 10)
    expect(a).toEqual(b)
  })

  it('produces different sequences for different seeds', () => {
    const a = genSequenceUInt32(1, 5)
    const b = genSequenceUInt32(2, 5)
    // Not a strict guarantee, but with high probability they differ
    expect(a).not.toEqual(b)
  })

  it('nextFloat stays within [0, 1)', () => {
    const rng = createXorShift32(42)
    for (let i = 0; i < 1000; i++) {
      const f = rng.nextFloat()
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThan(1)
    }
  })

  it('nextInt(n) stays within 0..n-1 and handles n<=0 defensively', () => {
    const rng = createXorShift32(987654321)
    expect(rng.nextInt(0)).toBe(0)
    expect(rng.nextInt(-5)).toBe(0)

    for (let n = 1; n <= 10; n++) {
      for (let i = 0; i < 200; i++) {
        const v = rng.nextInt(n)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(n)
      }
    }
  })
})

describe('shuffleInPlace', () => {
  it('is reproducible with the same seed and yields a permutation of the original array', () => {
    const seed = 123
    const base = Array.from({ length: 20 }, (_, i) => i)

    const arr1 = base.slice()
    const arr2 = base.slice()

    shuffleInPlace(arr1, createXorShift32(seed))
    shuffleInPlace(arr2, createXorShift32(seed))

    expect(arr1).toEqual(arr2)
    // Check it is a permutation (same elements, different order likely)
    expect(arr1.slice().sort((a, b) => a - b)).toEqual(base)
  })

  it('different seeds likely yield different permutations', () => {
    const base = Array.from({ length: 30 }, (_, i) => i)

    const a = base.slice()
    const b = base.slice()

    shuffleInPlace(a, createXorShift32(1))
    shuffleInPlace(b, createXorShift32(2))

    // High probability they differ
    expect(a).not.toEqual(b)
  })
})
