import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TopBar from '../TopBar.vue'

// Mock the status store used in TopBar
vi.mock('@/frontend/features/game/store/status', () => {
  return {
    useStatusStore: () => ({
      networkOk: true,
    }),
  }
})

// Stub UiButton
vi.mock('@/frontend/ui/Button.vue', () => ({
  default: {
    name: 'UiButton',
    template: '<button class="ui-button" @click="$emit(\'click\')"><slot /></button>',
  },
}))

describe('TopBar.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders default title when no prop provided', () => {
    const wrapper = mount(TopBar, {
      props: { showAdminBar: false },
    })
    expect(wrapper.find('.topbar-title').text()).toBe('Verrassingskalender')
  })

  it('renders custom title', () => {
    const wrapper = mount(TopBar, {
      props: { showAdminBar: false, title: 'Mijn Titel' },
    })
    expect(wrapper.find('.topbar-title').text()).toBe('Mijn Titel')
  })

  it('emits toggle when admin button is clicked', async () => {
    const wrapper = mount(TopBar, {
      props: { showAdminBar: false },
    })
    await wrapper.find('button.ui-button').trigger('click')
    expect(wrapper.emitted('toggle')).toBeTruthy()
  })

  it('shows network ok indicator by default (mocked store)', () => {
    const wrapper = mount(TopBar, { props: { showAdminBar: false } })
    const indicator = wrapper.find('.net-indicator')
    expect(indicator.exists()).toBe(true)
    expect(indicator.classes()).toContain('ok')
    expect(indicator.text()).toContain('Verbonden')
  })

  it('reflects offline state when store mock returns false', async () => {
    // Re-import with a different mock
    vi.resetModules()
    vi.doMock('@/frontend/features/game/store/status', () => ({
      useStatusStore: () => ({ networkOk: false }),
    }))
    // Re-stub UiButton for this fresh import
    vi.doMock('@/frontend/ui/Button.vue', () => ({
      default: {
        name: 'UiButton',
        template: '<button class="ui-button" @click="$emit(\'click\')"><slot /></button>',
      },
    }))
    const OfflineTopbar = (await import('../TopBar.vue')).default
    const wrapper = mount(OfflineTopbar, { props: { showAdminBar: false } })
    const indicator = wrapper.find('.net-indicator')
    expect(indicator.classes()).toContain('down')
    expect(indicator.text()).toContain('Offline')
  })
})
