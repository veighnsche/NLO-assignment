// Deterministic PRNG utilities (xorshift32-based)
// Provides reproducible sequences for seeding and shuffling

/**
 * Public interface for our deterministic RNG.
 *
 * Notes on ranges:
 * - `nextUint32()` returns a 32-bit unsigned integer in [0, 2^32-1].
 * - `nextFloat()` returns a floating-point number in [0.0, 1.0).
 * - `nextInt(maxExclusive)` returns an integer in [0, maxExclusive-1].
 */
export interface RNG {
  seed: number
  nextUint32(): number
  nextFloat(): number // [0,1)
  nextInt(maxExclusive: number): number // 0..maxExclusive-1
}

/**
 * Create a xorshift32 PRNG.
 *
 * Xorshift32 is a simple, fast PRNG appropriate for simulations and
 * shuffling where cryptographic security is not required.
 *
 * Implementation details:
 * - Internal state is a 32-bit signed integer (JavaScript bitwise ops coerce to 32-bit).
 * - A zero seed is not allowed because it would lock the generator at zero; we
 *   remap it to a fixed non-zero constant to guarantee progress.
 *
 * @param seed Any 32-bit integer. Zero will be remapped to a constant.
 * @returns RNG instance with `nextUint32`, `nextFloat`, and `nextInt` methods.
 */
export function createXorShift32(seed: number): RNG {
  let state = seed | 0
  if (state === 0) state = 0x9e3779b9 | 0 // avoid zero lock

  return {
    seed: state,
    nextUint32() {
      // Core xorshift32 step: shift/xor the internal 32-bit state.
      // The sequence is deterministic given the initial seed.
      let x = state | 0
      x ^= x << 13
      x ^= x >>> 17
      x ^= x << 5
      state = x | 0
      // Convert to unsigned 32-bit range [0, 2^32-1].
      return state >>> 0
    },
    nextFloat() {
      // Use the upper 24 bits to build a float in [0,1).
      // Shifting by 8 drops the lower 8 bits (often noisier),
      // dividing by 2^24 (16777216) yields a uniform float in [0,1).
      return (this.nextUint32() >>> 8) / 16777216 // 24-bit mantissa
    },
    nextInt(maxExclusive: number) {
      // Return integer in [0, maxExclusive-1].
      // Defensive: avoid division by zero/negative.
      if (maxExclusive <= 0) return 0
      // For many typical small bounds, modulo is acceptable. If strict
      // unbiasedness is needed for arbitrary bounds, use rejection sampling.
      const r = this.nextUint32()
      return r % maxExclusive
    },
  }
}

/**
 * In-place Fisher–Yates shuffle using the provided RNG.
 *
 * This produces a uniform random permutation assuming the RNG is uniform
 * and `nextInt(i+1)` yields each index 0..i with equal probability.
 *
 * @param arr Array to shuffle (mutated).
 * @param rng Deterministic RNG instance.
 */
export function shuffleInPlace<T>(arr: T[], rng: RNG): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1)
    if (j !== i) {
      const tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
    }
  }
}
