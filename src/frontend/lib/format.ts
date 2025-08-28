// Shared formatting utilities
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/shared/constants/i18n'

export const nfCurrency = new Intl.NumberFormat(DEFAULT_LOCALE, {
  style: 'currency',
  currency: DEFAULT_CURRENCY,
  maximumFractionDigits: 0,
})

export function formatCurrency(amount?: number | null): string {
  return amount != null ? nfCurrency.format(amount) : ''
}
