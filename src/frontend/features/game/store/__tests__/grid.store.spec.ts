import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGridStore } from '../grid'

// Mocks for dependent modules used inside the grid store
const statusMock = {
  networkOk: true,
  isBooting: false,
  isRefreshing: false,
  isRevealing: false,
  setNetworkOk: vi.fn(function (this: any, ok: boolean) {
    statusMock.networkOk = ok
  }),
  setBooting: vi.fn(function (this: any, v: boolean) {
    statusMock.isBooting = v
  }),
  setRefreshing: vi.fn(function (this: any, v: boolean) {
    statusMock.isRefreshing = v
  }),
  setRevealing: vi.fn(function (this: any, v: boolean) {
    statusMock.isRevealing = v
  }),
}
vi.mock('@/frontend/features/game/store/status', () => ({
  useStatusStore: () => statusMock,
}))

const sessionMock = {
  assignedUser: null as null | { id: string; name: string },
  activePlayerId: null as string | null,
  ensureAssignedUser: vi.fn(async () => {
    if (!sessionMock.assignedUser) sessionMock.assignedUser = { id: 'u1', name: 'User One' }
  }),
  resolveUserIds: vi.fn(async () => {}),
}
vi.mock('@/frontend/features/game/store/session', () => ({
  useSessionStore: () => sessionMock,
}))

const apiMocks = vi.hoisted(() => ({
  apiBoot: vi.fn(async () => {}),
  apiSnapshot: vi.fn(async () => ({
    meta: { version: 1, etag: 'e1' },
    revealed: [],
    openedCount: 0,
    total: 3,
  })),
  apiReveal: vi.fn(async () => ({
    ok: true,
    cell: { id: 'c1', row: 0, col: 0, revealed: true },
    meta: { version: 2, etag: 'e2' },
  })),
}))
vi.mock('@/frontend/features/game/api', () => apiMocks)

describe('useGridStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // reset mocks/state
    statusMock.networkOk = true
    statusMock.isBooting = false
    statusMock.isRefreshing = false
    statusMock.isRevealing = false
    sessionMock.assignedUser = null
    sessionMock.activePlayerId = null
    vi.clearAllMocks()
  })

  it('boot() calls apiBoot, refresh() and ensureAssignedUser, toggling status flags', async () => {
    const g = useGridStore()
    await g.boot(123)
    expect(apiMocks.apiBoot).toHaveBeenCalled()
    expect(statusMock.setBooting).toHaveBeenCalledWith(true)
    expect(statusMock.setBooting).toHaveBeenLastCalledWith(false)
    expect(apiMocks.apiSnapshot).toHaveBeenCalled()
    expect(sessionMock.ensureAssignedUser).toHaveBeenCalled()
  })

  it('refresh() applies snapshot and toggles refreshing flag', async () => {
    const g = useGridStore()
    await g.refresh()
    expect(statusMock.setRefreshing).toHaveBeenCalledWith(true)
    expect(statusMock.setRefreshing).toHaveBeenLastCalledWith(false)
    expect(g.meta?.etag).toBe('e1')
    expect(g.total).toBe(3)
    expect(g.openedCount).toBe(0)
  })

  it('refresh() resolves user ids when revealed items include revealedBy', async () => {
    apiMocks.apiSnapshot.mockResolvedValueOnce({
      meta: { version: 1, etag: 'e2' },
      revealed: [
        { id: 'a', row: 0, col: 0, revealed: true, revealedBy: 'u2' },
        { id: 'b', row: 0, col: 1, revealed: true },
      ],
      openedCount: 2,
      total: 3,
    } as any)
    const g = useGridStore()
    await g.refresh()
    expect(sessionMock.resolveUserIds).toHaveBeenCalledWith(['u2'])
    expect(g.revealedSet.has('a')).toBe(true)
    expect(g.revealedById.get('a')?.id).toBe('a')
  })

  it('refresh() sets networkOk false on API error and resets flag', async () => {
    apiMocks.apiSnapshot.mockRejectedValueOnce(new Error('net'))
    const g = useGridStore()
    await g.refresh()
    expect(statusMock.setNetworkOk).toHaveBeenCalledWith(false)
    expect(statusMock.setRefreshing).toHaveBeenLastCalledWith(false)
  })

  it('userHasRevealed returns true when current user has a revealed cell', () => {
    const g = useGridStore()
    sessionMock.activePlayerId = 'p1'
    g.revealed = [
      { id: 'x', row: 1, col: 1, revealed: true, revealedBy: 'p1' },
      { id: 'y', row: 1, col: 2, revealed: true },
    ] as any
    expect(g.userHasRevealed()).toBe(true)
  })

  it('reveal() early-returns when already revealing', async () => {
    const g = useGridStore()
    statusMock.isRevealing = true
    await g.reveal('c1')
    expect(apiMocks.apiReveal).not.toHaveBeenCalled()
  })

  it('reveal() early-returns when user already revealed', async () => {
    const g = useGridStore()
    sessionMock.activePlayerId = 'p1'
    g.revealed = [{ id: 'x', row: 1, col: 1, revealed: true, revealedBy: 'p1' }] as any
    await g.reveal('c2')
    expect(apiMocks.apiReveal).not.toHaveBeenCalled()
  })

  it('reveal() calls api, toggles flags, ensures user, and refreshes on success', async () => {
    const g = useGridStore()
    const refreshSpy = vi.spyOn(g, 'refresh').mockResolvedValue()
    sessionMock.activePlayerId = 'p1'
    await g.reveal('cell-123')
    expect(statusMock.setRevealing).toHaveBeenCalledWith(true)
    expect(apiMocks.apiReveal).toHaveBeenCalledWith('cell-123', 'p1')
    expect(statusMock.setNetworkOk).toHaveBeenCalledWith(true)
    expect(refreshSpy).toHaveBeenCalled()
    // ensure flag reset
    expect(statusMock.setRevealing).toHaveBeenLastCalledWith(false)
    refreshSpy.mockRestore()
  })

  it('reveal() sets networkOk false and resets flag on error', async () => {
    const g = useGridStore()
    const err = new Error('boom')
    apiMocks.apiReveal.mockRejectedValueOnce(err)
    await expect(g.reveal('bad')).rejects.toThrow('boom')
    expect(statusMock.setNetworkOk).toHaveBeenCalledWith(false)
    expect(statusMock.setRevealing).toHaveBeenLastCalledWith(false)
  })
})
