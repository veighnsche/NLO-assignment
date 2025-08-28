import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../Button.vue'

const mountBtn = (props: any = {}, slots: any = { default: 'Click me' }) =>
  mount(Button, { props, slots })

describe('UiButton', () => {
  it('renders slot content', () => {
    const w = mountBtn()
    expect(w.text()).toContain('Click me')
  })

  it('applies classes for color/variant/size and flags', () => {
    const w = mountBtn({ color: 'primary', variant: 'outline', size: 'lg', block: true, icon: true })
    const el = w.get('button')
    expect(el.classes()).toContain('color-primary')
    expect(el.classes()).toContain('variant-outline')
    expect(el.classes()).toContain('size-lg')
    expect(el.classes()).toContain('is-block')
    expect(el.classes()).toContain('is-icon')
  })

  it('sets disabled and loading states correctly', async () => {
    const w = mountBtn({ disabled: true })
    const btn = w.get('button')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.attributes('aria-disabled')).toBe('true')

    await w.setProps({ disabled: false, loading: true })
    expect(btn.attributes('disabled')).toBeDefined() // disabled when loading
    expect(btn.attributes('aria-busy')).toBe('true')
    expect(btn.classes()).toContain('is-loading')
  })

  it('honors button type prop', () => {
    const w = mountBtn({ type: 'submit' })
    expect(w.get('button').attributes('type')).toBe('submit')
  })
})
