import { beforeAll, beforeEach, describe, it, expect } from 'vitest'
import {
  bootDatabase,
  adminReset,
  getSnapshotForClient,
  getAdminTargets,
  revealCell,
  botStep,
} from '@/backend/services/grid.service'
import { setCurrentPlayer } from '@/backend/services/users.service'
import { getUsersMemory, setMemory } from '@/backend/infra/state'
import { cellId } from '@/backend/domain/grid/schema'

const SEED = 24680

describe('services/grid.service', () => {
  beforeAll(async () => {
    await bootDatabase(SEED)
  })

  beforeEach(async () => {
    await adminReset('hard', SEED)
  })

  it('getSnapshotForClient returns counts and revealed filter; openedCount maintained', async () => {
    const snap0 = getSnapshotForClient()
    expect(snap0.openedCount).toBe(0)
    expect(snap0.revealed.length).toBe(0)

    const id = cellId(0, 0)
    const res = await revealCell(id, undefined, { bypassEligibility: true, overrideRevealedBy: 'bot' })
    if ('error' in res) throw new Error('expected ok reveal')

    const snap1 = getSnapshotForClient()
    expect(snap1.openedCount).toBe(1)
    expect(snap1.revealed.find((c) => c.id === id)).toBeTruthy()
  })

  it('getAdminTargets returns consistent target cells with valid prizes', () => {
    const t = getAdminTargets()
    // Should be at least one target (grand) and likely many consolation
    expect(Array.isArray(t)).toBe(true)
    // Validate shape and ranges
    for (const item of t) {
      expect(item.id).toBeTypeOf('string')
      expect(item.row).toBeGreaterThanOrEqual(0)
      expect(item.row).toBeLessThan(100)
      expect(item.col).toBeGreaterThanOrEqual(0)
      expect(item.col).toBeLessThan(100)
      expect([100, 25000]).toContain(item.prize.amount)
    }
  })

  describe('revealCell error branches and options', () => {
    it('returns NOT_FOUND for unknown id', async () => {
      const res = await revealCell('nope')
      expect(res).toEqual({ error: 'NOT_FOUND' })
    })

    it('returns ALREADY_REVEALED when revealing twice', async () => {
      const id = cellId(0, 1)
      const r1 = await revealCell(id, undefined, { bypassEligibility: true })
      if ('error' in r1) throw new Error('expected ok')
      const r2 = await revealCell(id, undefined, { bypassEligibility: true })
      expect(r2).toEqual({ error: 'ALREADY_REVEALED' })
    })

    it('enforces NOT_YOUR_TURN when currentPlayerId is set to someone else', async () => {
      const users = getUsersMemory()!
      const ids = Object.keys(users)
      const current = ids[0]
      const other = ids.find((x) => x !== current)!
      const sr = await setCurrentPlayer(current)
      expect('ok' in sr && sr.ok).toBe(true)

      const id = cellId(0, 2)
      const res = await revealCell(id, other)
      expect(res).toEqual({ error: 'NOT_YOUR_TURN' })
    })

    it('returns NOT_ELIGIBLE when user does not exist', async () => {
      const id = cellId(0, 3)
      const res = await revealCell(id, 'ghost-user')
      expect(res).toEqual({ error: 'NOT_ELIGIBLE' })
    })

    it('returns ALREADY_PLAYED when user already played', async () => {
      const users = getUsersMemory()!
      const ids = Object.keys(users)
      const playedId = ids[0]
      users[playedId].played = true
      const id = cellId(0, 4)
      const res = await revealCell(id, playedId)
      expect(res).toEqual({ error: 'ALREADY_PLAYED' })
    })

    it('supports overrideRevealedBy and bypassEligibility', async () => {
      const id = cellId(0, 5)
      const res = await revealCell(id, 'bot', { bypassEligibility: true, overrideRevealedBy: 'user-123' })
      if ('error' in res) throw new Error('expected ok')
      expect(res.cell.revealedBy).toBe('user-123')
    })
  })

  it('botStep returns NOT_BOOTED when memory not initialized', async () => {
    // Temporarily clear the memory and test botStep
    setMemory(null)
    const res = await botStep()
    expect(res).toEqual({ error: 'NOT_BOOTED' })
    // Reboot for isolation
    await bootDatabase(SEED)
  })
})
