import { defineStore } from 'pinia'

export type ExposedTarget = {
  id: string
  row: number
  col: number
  prize: { type: 'consolation' | 'grand'; amount: 100 | 25000 }
}

export const useExposedStore = defineStore('exposed', {
  state: () => ({
    targetsEtag: null as string | null,
    targets: [] as ExposedTarget[],
    ids: new Set<string>() as Set<string>,
  }),
  getters: {
    exposedSet(state): Set<string> {
      return state.ids
    },
  },
  actions: {
    setTargets(targets: ExposedTarget[], etag: string | null) {
      this.targets = targets
      this.ids.clear()
      for (const t of targets) this.ids.add(t.id)
      this.targetsEtag = etag
    },
    clearTargets() {
      this.targets = []
      this.targetsEtag = null
      this.ids.clear()
    },
  },
})
