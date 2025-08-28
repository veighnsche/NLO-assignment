import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStatusStore } from '../status'

describe('useStatusStore', () => {
  it('sets network and flags via actions', () => {
    setActivePinia(createPinia())
    const s = useStatusStore()

    // defaults
    expect(s.networkOk).toBe(true)
    expect(s.isBooting).toBe(false)
    expect(s.isRefreshing).toBe(false)
    expect(s.isRevealing).toBe(false)

    s.setNetworkOk(false)
    s.setBooting(true)
    s.setRefreshing(true)
    s.setRevealing(true)

    expect(s.networkOk).toBe(false)
    expect(s.isBooting).toBe(true)
    expect(s.isRefreshing).toBe(true)
    expect(s.isRevealing).toBe(true)
  })
})
