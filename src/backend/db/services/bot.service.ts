// Bot-related configuration (no DB writes here)
let BOT_DELAY_MIN_MS = 300
let BOT_DELAY_MAX_MS = 1500

export function setBotDelayRange(minMs: number, maxMs: number): void {
  // Ensure sane values and ordering
  const min = Math.max(0, Math.floor(minMs))
  const max = Math.max(min, Math.floor(maxMs))
  BOT_DELAY_MIN_MS = min
  BOT_DELAY_MAX_MS = max
}

export function getBotDelayRange(): { minMs: number; maxMs: number } {
  return { minMs: BOT_DELAY_MIN_MS, maxMs: BOT_DELAY_MAX_MS }
}
