import { describe, it, expect } from 'vitest'
import { ensureBooted } from '@/backend/infra/state'
import type { GridState } from '@/backend/domain/grid/schema'

// Minimal GridState shape for the assert function
const minimalState: GridState = {
  cells: {} as GridState['cells'],
  meta: { version: 1, etag: 'v-1' },
}

describe('infra/state.ensureBooted', () => {
  it('throws when state is null', () => {
    expect(() => ensureBooted(null)).toThrowError('Database not booted. Call bootDatabase() first.')
  })

  it('does not throw when state is present', () => {
    expect(() => ensureBooted(minimalState)).not.toThrow()
  })
})
