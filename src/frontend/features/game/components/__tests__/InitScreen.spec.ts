import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InitScreen from '../InitScreen.vue'

describe('InitScreen.vue', () => {
  it('renders loading status with aria attributes', () => {
    const wrapper = mount(InitScreen)
    const section = wrapper.get('section[role="status"]')
    expect(section.attributes('aria-busy')).toBe('true')
    expect(wrapper.text()).toContain('Je ervaring wordt voorbereid')
  })

  it('renders default slot content', () => {
    const wrapper = mount(InitScreen, {
      slots: { default: '<span class="extra">Meer info…</span>' },
    })
    expect(wrapper.find('.extra').exists()).toBe(true)
  })
})
