export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// inclusive range. Allows an optional deterministic source.
// `rng` can be:
//  - an object with `nextFloat(): number` (e.g. domain/shared/rng RNG)
//  - a function returning number in [0,1)
//  - omitted to use Math.random()
export function randomInt(
  min: number,
  max: number,
  rng?: { nextFloat(): number } | (() => number),
): number {
  const a = Math.floor(min)
  const b = Math.floor(max)
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const r = typeof rng === 'function' ? rng() : rng ? rng.nextFloat() : Math.random()
  return Math.floor(r * (hi - lo + 1)) + lo
}
