export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// inclusive range
export function randomInt(min: number, max: number): number {
  const a = Math.floor(min)
  const b = Math.floor(max)
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}
