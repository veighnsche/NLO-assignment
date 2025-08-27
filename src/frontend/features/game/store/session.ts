import { defineStore } from 'pinia'
import { apiUsersAssign, apiUsersResolve } from '@/frontend/features/game/api'
import { apiAdminGetCurrentPlayer } from '@/frontend/features/admin/api'

export const useSessionStore = defineStore('session', {
  state: () => ({
    assignedUser: null as null | { id: string; name: string },
    userNames: new Map<string, string>() as Map<string, string>,
    currentPlayerId: undefined as string | undefined,
    currentPlayerName: '' as string,
  }),
  getters: {
    userNameById(state): (id?: string | null) => string | null {
      return (id?: string | null) => {
        if (!id) return null
        return state.userNames.get(id) ?? null
      }
    },
    activePlayerId(state): string | null {
      return state.currentPlayerId ?? state.assignedUser?.id ?? null
    },
    activePlayerName(state): string {
      if (state.currentPlayerName) return state.currentPlayerName
      const id = state.currentPlayerId ?? state.assignedUser?.id
      if (!id) return ''
      return state.userNames.get(id) ?? state.assignedUser?.name ?? ''
    },
  },
  actions: {
    getAssignedUserId(): string | null {
      return this.assignedUser?.id ?? null
    },
    async ensureAssignedUser() {
      if (this.assignedUser) return
      const u = await apiUsersAssign()
      this.assignedUser = { id: u.userId, name: u.name }
      this.userNames.set(u.userId, u.name)
    },
    async refreshCurrentPlayer() {
      try {
        const { currentPlayerId } = await apiAdminGetCurrentPlayer()
        this.currentPlayerId = currentPlayerId ?? undefined
        if (this.currentPlayerId) {
          const id = this.currentPlayerId
          const cached = this.userNames.get(id)
          if (cached) {
            this.currentPlayerName = cached
          } else {
            try {
              const res = await apiUsersResolve([id])
              const nm = res.users[0]?.name ?? ''
              if (nm) this.userNames.set(id, nm)
              this.currentPlayerName = nm
            } catch {
              this.currentPlayerName = ''
            }
          }
        } else {
          await this.ensureAssignedUser()
          this.currentPlayerName = this.assignedUser?.name ?? ''
        }
      } catch {
        this.currentPlayerId = undefined
        this.currentPlayerName = ''
      }
    },
    async resolveUserIds(ids: string[]) {
      if (ids.length === 0) return
      try {
        const toResolve = ids.filter((id) => !this.userNames.has(id))
        if (toResolve.length === 0) return
        const res = await apiUsersResolve(toResolve)
        for (const u of res.users) this.userNames.set(u.id, u.name)
      } catch {
        // ignore resolve errors in dev
      }
    },
  },
})
