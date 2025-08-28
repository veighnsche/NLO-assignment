import { beforeAll, beforeEach, describe, it, expect } from 'vitest'
import { bootDatabase, adminReset } from '@/backend/services/grid.service'
import {
  pickRandomEligibleUser,
  getCurrentPlayer,
  setCurrentPlayer,
  listEligibleUsers,
  assignUserForClient,
  resolveUsers,
} from '@/backend/services/users.service'
import { getUsersMemory, setUsersMemory, getMemory } from '@/backend/infra/state'

const SEED = 12345

describe('services/users.service', () => {
  beforeAll(async () => {
    await bootDatabase(SEED)
  })

  beforeEach(async () => {
    // Reset deterministic state and users each test
    await adminReset(SEED)
  })

  it('pickRandomEligibleUser selects a player and sets currentPlayerId', async () => {
    const res = await pickRandomEligibleUser()
    if ('error' in res) throw new Error('expected ok')
    expect(res.ok).toBe(true)
    const cur = getCurrentPlayer()
    expect(cur.currentPlayerId).toBeTypeOf('string')
    expect(cur.currentPlayerId).toBe(res.playerId)
  })

  it('getCurrentPlayer reflects setCurrentPlayer and can be cleared', async () => {
    const users = getUsersMemory()!
    const someId = Object.keys(users)[0]
    let res = await setCurrentPlayer(someId)
    expect('ok' in res && res.ok).toBe(true)
    expect(getCurrentPlayer().currentPlayerId).toBe(someId)

    res = await setCurrentPlayer(null)
    expect('ok' in res && res.ok).toBe(true)
    expect(getCurrentPlayer().currentPlayerId).toBeUndefined()
  })

  it('setCurrentPlayer rejects invalid/played users', async () => {
    // invalid id
    let res = await setCurrentPlayer('does-not-exist')
    expect(res).toEqual({ error: 'NOT_ELIGIBLE' })

    // mark a real user as played by assigning current then revealing via eligibility pathway
    const users = getUsersMemory()!
    const ids = Object.keys(users)
    const playedId = ids[0]
    users[playedId].played = true

    res = await setCurrentPlayer(playedId)
    expect(res).toEqual({ error: 'NOT_ELIGIBLE' })
  })

  it('listEligibleUsers paginates and filters', async () => {
    const { total, users } = listEligibleUsers(0, 10)
    expect(total).toBeGreaterThan(0)
    expect(users.length).toBeLessThanOrEqual(10)

    // filter by part of an id or name from first page
    const sample = users[0]
    const byId = listEligibleUsers(0, 100, sample.id.slice(0, 3))
    expect(byId.total).toBeGreaterThan(0)

    const byName = listEligibleUsers(0, 100, sample.name.split(' ')[0])
    expect(byName.total).toBeGreaterThan(0)
  })

  it('assignUserForClient is deterministic per clientId', async () => {
    const a1 = assignUserForClient('client-xyz')
    const a2 = assignUserForClient('client-xyz')
    expect(a1).toEqual(a2)

    const b = assignUserForClient('client-other')
    expect(b.id).not.toBe(a1.id)
  })

  it('resolveUsers returns only known ids', async () => {
    const users = getUsersMemory()!
    const ids = Object.keys(users)
    const known = ids.slice(0, 3)
    const res = resolveUsers([...known, 'nope'])
    expect(res.map((u) => u.id).sort()).toEqual(known.sort())
  })

  it('pickRandomEligibleUser returns NO_ELIGIBLE when users missing', async () => {
    // Ensure boot state exists, then clear users map
    expect(getUsersMemory()).toBeTruthy()
    setUsersMemory(null)
    const res = await pickRandomEligibleUser()
    expect(res).toEqual({ error: 'NO_ELIGIBLE' })
  })

  it('listEligibleUsers returns empty when users missing', () => {
    setUsersMemory(null)
    const res = listEligibleUsers(0, 10)
    expect(res).toEqual({ total: 0, users: [] })
  })

  it('assignUserForClient throws when users missing', () => {
    setUsersMemory(null)
    expect(() => assignUserForClient('any')).toThrowError('Users not initialized')
  })

  it('resolveUsers returns [] when users missing', () => {
    setUsersMemory(null)
    const res = resolveUsers(['a', 'b'])
    expect(res).toEqual([])
  })

  it('pickRandomEligibleUser works with undefined meta.seed (fallback seed path)', async () => {
    // Ensure booted and users present
    expect(getUsersMemory()).toBeTruthy()
    const mem = getMemory()!
    // Simulate older meta without explicit seed
    mem.meta.seed = undefined
    const res = await pickRandomEligibleUser()
    expect('ok' in res && res.ok).toBe(true)
    expect(getCurrentPlayer().currentPlayerId).toBeTypeOf('string')
  })

  it('assignUserForClient works with undefined meta.seed (fallback seed path)', () => {
    const mem = getMemory()!
    mem.meta.seed = undefined
    const a = assignUserForClient('client-fallback')
    const b = assignUserForClient('client-fallback')
    expect(a).toEqual(b)
  })

  it('pickRandomEligibleUser works with present meta.seed (primary seed path)', async () => {
    // Ensure users exist
    expect(getUsersMemory()).toBeTruthy()
    const mem = getMemory()!
    mem.meta.seed = 2025
    const res = await pickRandomEligibleUser()
    expect('ok' in res && res.ok).toBe(true)
    expect(getCurrentPlayer().currentPlayerId).toBeTypeOf('string')
  })

  it('assignUserForClient works with present meta.seed (primary seed path)', () => {
    const mem = getMemory()!
    mem.meta.seed = 2025
    const a = assignUserForClient('client-present')
    const b = assignUserForClient('client-present')
    expect(a).toEqual(b)
  })
})
