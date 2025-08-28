import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Footer from '../Footer.vue'

let mockGrid: any

vi.mock('@/frontend/features/game/store/grid', () => ({
  useGridStore: () => mockGrid,
}))

// Stub Iconify Icon component
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    props: ['icon'],
    template: '<span class="icon-stub" :data-icon="icon"></span>',
  },
}))

describe('Footer.vue', () => {
  beforeEach(() => {
    mockGrid = {
      total: 12,
      openedCount: 3,
    }
  })

  it('renders remaining and total correctly', () => {
    const wrapper = mount(Footer)
    const small = wrapper.find('.legal-row small')
    expect(small.text()).toContain('Nog 9 van 12 te openen')
  })

  it('does not show negative remaining', () => {
    mockGrid.total = 5
    mockGrid.openedCount = 10
    const wrapper = mount(Footer)
    const small = wrapper.find('.legal-row small')
    expect(small.text()).toContain('Nog 0 van 5 te openen')
  })

  it('renders social icons (stubbed)', () => {
    const wrapper = mount(Footer)
    const icons = wrapper.findAll('.icon-stub')
    expect(icons.length).toBeGreaterThanOrEqual(3)
  })
})
