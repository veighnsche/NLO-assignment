import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../api', () => ({
  // not used directly here
}))
vi.mock('../../../admin/api', () => ({
  apiAdminGetCurrentPlayer: vi.fn().mockResolvedValue({ currentPlayerId: null }),
}))
vi.mock('../../api', async (orig) => {
  return {
    ...(await orig()),
    apiUsersAssign: vi.fn().mockResolvedValue({ userId: 'u1', name: 'User One' }),
    apiUsersResolve: vi.fn().mockResolvedValue({ users: [{ id: 'u1', name: 'User One' }] }),
  }
})

import { useSessionStore } from '../session'
import { apiUsersAssign } from '../../api'
import { apiAdminGetCurrentPlayer } from '../../../admin/api'

describe('useSessionStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('ensureAssignedUser assigns and caches', async () => {
    const s = useSessionStore()
    await s.ensureAssignedUser()
    expect(apiUsersAssign).toHaveBeenCalled()
    expect(s.assignedUser?.id).toBe('u1')
    expect(s.userNames.get('u1')).toBe('User One')
  })

  it('refreshCurrentPlayer without current player assigns user and sets name', async () => {
    const s = useSessionStore()
    await s.refreshCurrentPlayer()
    expect(apiAdminGetCurrentPlayer).toHaveBeenCalled()
    expect(s.currentPlayerId).toBeUndefined()
    expect(s.currentPlayerName).toBe('User One')
    // When there is no current player id, we assign a user and do not need to resolve
  })

  it('getters: userNameById, activePlayerId, activePlayerName', async () => {
    const s = useSessionStore()
    // Initially empty
    expect(s.userNameById(null)).toBeNull()
    expect(s.userNameById('x')).toBeNull()
    expect(s.activePlayerId).toBeNull()
    expect(s.activePlayerName).toBe('')

    // After assignment
    await s.ensureAssignedUser()
    expect(s.userNameById('u1')).toBe('User One')
    expect(s.activePlayerId).toBe('u1')
    expect(s.activePlayerName).toBe('User One')

    // If currentPlayerName set, it takes precedence
    s.currentPlayerId = 'u1'
    s.currentPlayerName = 'Override'
    expect(s.activePlayerName).toBe('Override')
  })

  it('getAssignedUserId returns id or null', async () => {
    const s = useSessionStore()
    expect(s.getAssignedUserId()).toBeNull()
    await s.ensureAssignedUser()
    expect(s.getAssignedUserId()).toBe('u1')
  })

  it('refreshCurrentPlayer uses cached name when available', async () => {
    // Override admin to return specific id
    const { apiAdminGetCurrentPlayer } = await import('../../../admin/api')
    ;(apiAdminGetCurrentPlayer as any).mockResolvedValueOnce({ currentPlayerId: 'u1' })

    const s = useSessionStore()
    // Pre-cache name
    s.userNames.set('u1', 'Cached User')
    await s.refreshCurrentPlayer()
    expect(s.currentPlayerId).toBe('u1')
    expect(s.currentPlayerName).toBe('Cached User')
  })

  it('refreshCurrentPlayer resolves name when not cached and handles resolve failure', async () => {
    const { apiAdminGetCurrentPlayer } = await import('../../../admin/api')
    ;(apiAdminGetCurrentPlayer as any).mockResolvedValueOnce({ currentPlayerId: 'u2' })

    // First, successful resolve path
    const { apiUsersResolve } = await import('../../api')
    ;(apiUsersResolve as any).mockResolvedValueOnce({ users: [{ id: 'u2', name: 'User Two' }] })
    const s1 = useSessionStore()
    await s1.refreshCurrentPlayer()
    expect(s1.currentPlayerId).toBe('u2')
    expect(s1.currentPlayerName).toBe('User Two')
    expect(s1.userNames.get('u2')).toBe('User Two')

    // Now failure path sets empty name
    ;(apiAdminGetCurrentPlayer as any).mockResolvedValueOnce({ currentPlayerId: 'u3' })
    ;(apiUsersResolve as any).mockRejectedValueOnce(new Error('boom'))
    const s2 = useSessionStore()
    await s2.refreshCurrentPlayer()
    expect(s2.currentPlayerId).toBe('u3')
    expect(s2.currentPlayerName).toBe('')
  })

  it('resolveUserIds does nothing for empty input and skips cached ids', async () => {
    const s = useSessionStore()
    // empty input
    await s.resolveUserIds([])

    // cache one id
    s.userNames.set('u1', 'User One')
    const { apiUsersResolve } = await import('../../api')
    ;(apiUsersResolve as any).mockClear()
    // u1 is cached, u2 should be resolved
    await s.resolveUserIds(['u1', 'u2'])
    expect(apiUsersResolve).toHaveBeenCalledWith(['u2'])
  })
})
