// Shared formatting utilities

export const nfCurrency = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount?: number | null): string {
  return amount != null ? nfCurrency.format(amount) : ''
}
