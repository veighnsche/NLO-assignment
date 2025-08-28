import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import GameMetrics from '../GameMetrics.vue'

// Different scenario: no grand revealed, user already revealed
vi.mock('@/frontend/features/game/store/grid', () => {
  return {
    useGridStore: () => ({
      openedCount: 5,
      total: 10,
      consolationTotal: 4,
      revealed: [
        { id: 'a', prize: { type: 'consolation' } },
        { id: 'b', prize: { type: 'none' } },
      ],
      userHasRevealed: () => true,
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

describe('GameMetrics.vue (alt state)', () => {
  it('renders metrics when user has revealed and grand is not opened yet', () => {
    const wrapper = mount(GameMetrics)
    expect(wrapper.text()).toContain('Geopend:')
    expect(wrapper.text()).toContain('5 / 10')
    expect(wrapper.text()).toContain('Troostprijzen geopend:')
    // only one consolation in revealed list
    expect(wrapper.text()).toContain('1 / 4')
    expect(wrapper.text()).toContain('Hoofdprijs:')
    // grand not opened should show the hidden text
    expect(wrapper.text().toLowerCase()).toContain('nog verborgen')
    expect(wrapper.text()).toContain('Kan openen:')
    // userHasRevealed -> cannot open (Nee)
    expect(wrapper.text().toLowerCase()).toContain('nee')
  })
})
