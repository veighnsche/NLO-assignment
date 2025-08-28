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
import { getMemory, getUsersMemory, setMemory, setUsersMemory } from '@/backend/infra/state'
import { openDatabase, STORE_META, STORE_USERS } from '@/backend/infra/idb'
import { cellId } from '@/backend/domain/grid/schema'

const SEED = 24680

describe('services/grid.service', () => {
  beforeAll(async () => {
    await bootDatabase(SEED)
  })

  beforeEach(async () => {
    await adminReset(SEED)
  })

  it('getSnapshotForClient returns counts and revealed filter; openedCount maintained', async () => {
    const snap0 = getSnapshotForClient()
    expect(snap0.openedCount).toBe(0)
    expect(snap0.revealed.length).toBe(0)

    const id = cellId(0, 0)
    const res = await revealCell(id, undefined, {
      bypassEligibility: true,
      overrideRevealedBy: 'bot',
    })
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

    it('throws when users memory missing but playerId provided', async () => {
      // Ensure booted and then clear users memory to trigger throw path
      expect(getUsersMemory()).toBeTruthy()
      setUsersMemory(null)
      const id = cellId(0, 6)
      await expect(revealCell(id, 'any-user')).rejects.toThrowError('Users not initialized')
    })

    it('returns ALREADY_REVEALED when revealing twice', async () => {
      const id = cellId(0, 1)
      const r1 = await revealCell(id, undefined, { bypassEligibility: true })
      if ('error' in r1) throw new Error('expected ok')
      const r2 = await revealCell(id, undefined, { bypassEligibility: true })
      expect(r2).toEqual({ error: 'ALREADY_REVEALED' })
    })

    it('allows reveal even when currentPlayerId is set to someone else (no turn-gating)', async () => {
      const users = getUsersMemory()!
      const ids = Object.keys(users)
      const current = ids[0]
      const other = ids.find((x) => x !== current)!
      const sr = await setCurrentPlayer(current)
      expect('ok' in sr && sr.ok).toBe(true)

      const id = cellId(0, 2)
      const res = await revealCell(id, other)
      expect('ok' in res && res.ok).toBe(true)
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
      const res = await revealCell(id, 'bot', {
        bypassEligibility: true,
        overrideRevealedBy: 'user-123',
      })
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

  it('bootDatabase backfills users when grid/meta exist but users missing in DB', async () => {
    // Ensure DB has grid/meta from reset
    await adminReset(SEED)
    // Remove users from IDB to simulate older DB
    const db = await openDatabase()
    const tx = db.transaction([STORE_USERS], 'readwrite')
    await tx.objectStore(STORE_USERS).delete('users')
    await tx.done
    // Clear memory and boot -> should regenerate and persist users
    setMemory(null)
    await bootDatabase(SEED)
    expect(getUsersMemory()).toBeTruthy()
    const tx2 = (await openDatabase()).transaction([STORE_USERS], 'readonly')
    const persisted = await tx2.objectStore(STORE_USERS).get('users')
    await tx2.done
    expect(persisted).toBeTruthy()
  })

  it('bootDatabase backfills revealOrder/revealIndex when missing in stored meta', async () => {
    await adminReset(SEED)
    const mem = getMemory()!
    const legacyMeta: Record<string, unknown> = {
      ...(mem.meta as unknown as Record<string, unknown>),
    }
    delete (legacyMeta as Record<string, unknown>).revealOrder
    delete (legacyMeta as Record<string, unknown>).revealIndex
    // Overwrite META store with legacyMeta
    const db = await openDatabase()
    const tx = db.transaction([STORE_META], 'readwrite')
    await tx.objectStore(STORE_META).put(legacyMeta, 'meta')
    await tx.done
    // Clear memory and boot -> should backfill fields
    setMemory(null)
    await bootDatabase(SEED)
    const after = getMemory()!
    expect(Array.isArray(after.meta.revealOrder)).toBe(true)
    expect(typeof after.meta.revealIndex).toBe('number')
  })

  it('botStep reseeds revealOrder when missing in memory', async () => {
    await adminReset(SEED)
    const mem = getMemory()!
    // Simulate missing fields in-memory
    delete (mem.meta as unknown as Record<string, unknown>).revealOrder
    delete (mem.meta as unknown as Record<string, unknown>).revealIndex
    const res = await botStep()
    if ('error' in res) throw new Error('expected ok')
    const m = getMemory()!
    expect(Array.isArray(m.meta.revealOrder)).toBe(true)
    expect(typeof m.meta.revealIndex).toBe('number')
  })

  it('botStep returns done=true when no id left to reveal', async () => {
    await adminReset(SEED)
    const mem = getMemory()!
    const order = mem.meta.revealOrder!
    mem.meta.revealIndex = order.length
    const res = await botStep()
    if ('error' in res) throw new Error('expected ok')
    expect(res.done).toBe(true)
    expect(res.revealed).toBeUndefined()
  })

  it('botStep skips already-revealed cells and continues', async () => {
    await adminReset(SEED)
    const mem = getMemory()!
    const order2 = mem.meta.revealOrder!
    const targetId = order2[0]
    const r1 = await revealCell(targetId, undefined, { bypassEligibility: true })
    if ('error' in r1) throw new Error('expected ok')
    mem.meta.revealIndex = 0
    const res = await botStep()
    if ('error' in res) throw new Error('expected ok')
    expect(res.done).toBe(false)
    expect(res.revealed).toBeTruthy()
    // Should not reveal the already revealed first id
    expect(res.revealed!.id).not.toBe(targetId)
  })
})
