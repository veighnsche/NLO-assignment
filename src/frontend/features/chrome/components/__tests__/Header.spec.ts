import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Header from '../Header.vue'

// Mock session store used by Header
vi.mock('@/frontend/features/game/store/session', () => {
  return {
    useSessionStore: () => ({
      activePlayerName: 'Alex',
    }),
  }
})

// Stub child components to avoid complex internals
vi.mock('@/frontend/features/chrome/ui/PrizeCard.vue', () => ({
  default: {
    name: 'PrizeCard',
    props: ['variant', 'count', 'amount', 'label', 'ariaLabel'],
    template: '<div class="prize-card-stub">Prize: {{ variant }}</div>',
  },
}))
vi.mock('@/frontend/features/chrome/ui/PlayStateCard.vue', () => ({
  default: {
    name: 'PlayStateCard',
    template: '<div class="playstate-card-stub">PlayState</div>',
  },
}))

describe('Header.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title when provided and shows player name', () => {
    const wrapper = mount(Header, { props: { title: 'Koptekst' } })
    expect(wrapper.find('.overline').text()).toBe('Koptekst')
    // Greeting contains player name from mocked store
    expect(wrapper.find('.greeting .name').text()).toBe('Alex')
  })

  it('renders prize cards and play state card stubs', () => {
    const wrapper = mount(Header)
    const stubs = wrapper.findAll('.prize-card-stub')
    expect(stubs.length).toBe(2)
    expect(wrapper.find('.playstate-card-stub').exists()).toBe(true)
  })
})
