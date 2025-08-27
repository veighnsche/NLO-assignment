import { defineStore } from 'pinia'

export const useStatusStore = defineStore('status', {
  state: () => ({
    networkOk: true as boolean,
    isBooting: false as boolean,
    isRefreshing: false as boolean,
    isRevealing: false as boolean,
  }),
  actions: {
    setNetworkOk(ok: boolean) {
      this.networkOk = ok
    },
    setBooting(v: boolean) {
      this.isBooting = v
    },
    setRefreshing(v: boolean) {
      this.isRefreshing = v
    },
    setRevealing(v: boolean) {
      this.isRevealing = v
    },
  },
})
