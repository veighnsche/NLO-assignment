import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import GameMetrics from '../GameMetrics.vue'

vi.mock('@/frontend/features/game/store/grid', () => {
  return {
    useGridStore: () => ({
      openedCount: 3,
      total: 10,
      consolationTotal: 4,
      revealed: [
        { id: 'a', prize: { type: 'consolation' } },
        { id: 'b', prize: { type: 'none' } },
        { id: 'c', prize: { type: 'grand' } },
      ],
      userHasRevealed: () => false,
    }),
  }
})

vi.mock('@/frontend/features/game/store/status', () => {
  return {
    useStatusStore: () => ({ isRevealing: false }),
  }
})

vi.mock('@iconify/vue', () => ({
  Icon: { name: 'Icon', template: '<i />' },
}))

describe('GameMetrics.vue', () => {
  it('renders key metrics and can-open state', () => {
    const wrapper = mount(GameMetrics)
    expect(wrapper.text()).toContain('Geopend:')
    expect(wrapper.text()).toContain('3 / 10')
    expect(wrapper.text()).toContain('Troostprijzen geopend:')
    expect(wrapper.text()).toContain('1 / 4')
    expect(wrapper.text()).toContain('Hoofdprijs:')
    // grand opened should be true due to revealed grand
    expect(wrapper.text()).toContain('Geopend')
    expect(wrapper.text()).toContain('Kan openen:')
    expect(wrapper.text()).toContain('Ja')
  })
})
