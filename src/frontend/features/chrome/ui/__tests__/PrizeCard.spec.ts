import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PrizeCard from '../PrizeCard.vue'

// Smoke tests to exercise render paths and computed props

describe('PrizeCard.vue', () => {
  it('renders grand variant with amount and label', () => {
    const wrapper = mount(PrizeCard, {
      props: { variant: 'grand', count: 1, amount: 25000, label: 'hoofdprijs' },
    })
    expect(wrapper.classes()).toContain('grand')
    expect(wrapper.text().toLowerCase()).toContain('hoofdprijs')
    // formatted currency text should be present
    expect(wrapper.text()).toMatch(/25\.?000|25\,?000|25\s?000|€|\$/)
    // aria-label should resolve for grand by default when not provided
    expect(wrapper.attributes('aria-label')).toBeDefined()
  })

  it('renders consolation variant and count', () => {
    const wrapper = mount(PrizeCard, {
      props: { variant: 'consolation', count: 100, amount: 100 },
    })
    expect(wrapper.classes()).toContain('consolation')
    expect(wrapper.find('.count').text()).toContain('×')
  })
})
