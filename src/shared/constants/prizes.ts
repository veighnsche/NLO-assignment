/**
 * Global prize constants used across the app.
 * Keep this as the single source of truth.
 */
export const PRIZES = {
  CONSOLATION_COUNT: 100,
  CONSOLATION_AMOUNT: 100,
  GRAND_COUNT: 1,
  GRAND_AMOUNT: 25000,
} as const;

export const {
  CONSOLATION_COUNT,
  CONSOLATION_AMOUNT,
  GRAND_COUNT,
  GRAND_AMOUNT,
} = PRIZES;
