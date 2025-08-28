import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PlayStateCard from '../PlayStateCard.vue'

// Helpers to change mocked store state per test
let mockGrid: any
let mockSession: any

vi.mock('@/frontend/features/game/store/grid', () => ({
  useGridStore: () => mockGrid,
}))

vi.mock('@/frontend/features/game/store/session', () => ({
  useSessionStore: () => mockSession,
}))

describe('PlayStateCard.vue', () => {
  beforeEach(() => {
    mockGrid = {
      revealed: [],
      openedCount: 0,
      total: 10,
      userHasRevealed: vi.fn(() => false),
    }
    mockSession = {
      activePlayerId: 'p1',
    }
  })

  it('shows can-open state when user can still open', () => {
    const wrapper = mount(PlayStateCard)
    expect(wrapper.classes()).toContain('state--can-open')
    expect(wrapper.find('.label').text()).toContain('Je kunt nog een vakje openen')
  })

  it('shows lost when cannot open and no reveal by me', () => {
    mockGrid.userHasRevealed = vi.fn(() => true)
    mockGrid.openedCount = 10
    const wrapper = mount(PlayStateCard)
    expect(wrapper.classes()).toContain('state--lost')
    expect(wrapper.find('.label').text()).toContain('Je beurt is geweest')
  })

  it('shows consolation when my revealed prize is consolation', () => {
    mockGrid.revealed = [{ id: 'c1', revealedBy: 'p1', prize: { type: 'consolation' } }]
    const wrapper = mount(PlayStateCard)
    expect(wrapper.classes()).toContain('state--consolation')
    expect(wrapper.find('.label').text()).toContain('troostprijs')
  })

  it('shows grand when my revealed prize is grand', () => {
    mockGrid.revealed = [{ id: 'c1', revealedBy: 'p1', prize: { type: 'grand' } }]
    const wrapper = mount(PlayStateCard)
    expect(wrapper.classes()).toContain('state--grand')
    expect(wrapper.find('.label').text()).toContain('hoofdprijs')
  })

  it('respects mediaAspect prop and backgroundImage override', () => {
    const wrapper = mount(PlayStateCard, {
      props: { mediaAspect: '4/3', backgroundImage: '/custom.png' },
    })
    const media = wrapper.find('.card-media')
    const styleAttr = (media.element as HTMLElement).getAttribute('style') || ''
    expect(styleAttr).toContain('aspect-ratio: 4/3')
    // Accept url(/custom.png) or url("/custom.png")
    expect(styleAttr).toMatch(/background-image:\s*url\(("|')?\/custom\.png\1?\)/)
  })
})
