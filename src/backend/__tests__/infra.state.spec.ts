import { describe, it, expect } from 'vitest'
import { ensureBooted } from '@/backend/infra/state'

// Minimal GridState shape for the assert function
const minimalState = {
  cells: {},
  meta: { version: 1, etag: 'v-1' },
} as any

describe('infra/state.ensureBooted', () => {
  it('throws when state is null', () => {
    expect(() => ensureBooted(null as any)).toThrowError('Database not booted. Call bootDatabase() first.')
  })

  it('does not throw when state is present', () => {
    expect(() => ensureBooted(minimalState)).not.toThrow()
  })
})
