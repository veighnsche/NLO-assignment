import { describe, expect, it } from 'vitest'
import { formatCurrency } from '../format'

describe('format', () => {
  it('formatCurrency formats EUR or returns empty for nullish', () => {
    expect(formatCurrency(100)).toContain('€')
    expect(formatCurrency(null)).toBe('')
    expect(formatCurrency(undefined)).toBe('')
  })
})
