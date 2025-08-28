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
})
