/**
 * Global prize constants used across the app.
 * Keep this as the single source of truth.
 */
export const PRIZES = {
  CONSOLATION_COUNT: 100,
  CONSOLATION_AMOUNT: 100,
  GRAND_COUNT: 1,
  GRAND_AMOUNT: 25000,
} as const

export const { CONSOLATION_COUNT, CONSOLATION_AMOUNT, GRAND_COUNT, GRAND_AMOUNT } = PRIZES

// Keep prize amounts as a compile-time derived union
export const PRIZE_AMOUNTS = [0, PRIZES.CONSOLATION_AMOUNT, PRIZES.GRAND_AMOUNT] as const
export type PrizeAmount = (typeof PRIZE_AMOUNTS)[number]
