// Utilities to convert between bot speed (Hz) and polling/delay intervals (ms)
// and to derive a backend delay window around a base interval.

export interface DelayWindow {
  minMs: number
  maxMs: number
}

// Centralized constants
import { MIN_HZ, MAX_HZ } from '@/shared/constants/bot'
export { DEFAULT_MIN_MS, DEFAULT_MAX_MS, MIN_HZ, MAX_HZ } from '@/shared/constants/bot'

export function clampHz(hz: number, min = MIN_HZ, max = MAX_HZ): number {
  const v = Number(hz)
  if (!Number.isFinite(v)) return min
  return Math.min(max, Math.max(min, v))
}

export function hzToIntervalMs(hz: number): number {
  const clamped = clampHz(hz)
  return Math.max(100, Math.round(1000 / clamped))
}

export function intervalToHz(ms: number): number {
  const v = Math.max(1, Number(ms) || 1000)
  return 1000 / v
}

// Derive a backend delay window roughly around a base interval.
// Keeps max >= min and avoids negatives.
export function intervalWindow(intervalMs: number): DelayWindow {
  const base = Math.max(1, Math.round(intervalMs))
  const minMs = Math.max(0, Math.round(base * 0.5))
  const maxMs = Math.max(minMs, Math.round(base * 1.5))
  return { minMs, maxMs }
}
