import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Tooltip from '../Tooltip.vue'

describe('UiTooltip', () => {
  it('renders into body when teleport is true and open', () => {
    const w = mount(Tooltip, {
      props: { open: true, teleport: true, id: 'tip1', x: 10, y: 20 },
      attachTo: document.body,
      slots: { default: 'Hello' },
    })
    const el = document.body.querySelector('#tip1') as HTMLElement
    expect(el).toBeTruthy()
    expect(el.getAttribute('role')).toBe('tooltip')
    expect(el.getAttribute('aria-hidden')).toBe('false')
    expect(el.textContent).toContain('Hello')
  })

  it('uses placement class and style variables for position and options', () => {
    const w = mount(Tooltip, {
      props: {
        open: true,
        teleport: false,
        x: 100,
        y: 200,
        placement: 'bottom',
        offset: 12,
        zIndex: 1234,
        maxWidth: '300px',
      },
      slots: { default: 'B' },
    })
    const el = w.get('[role="tooltip"]').element as HTMLElement
    expect(el.classList.contains('tt-bottom')).toBe(true)
    const style = el.getAttribute('style') || ''
    expect(style).toContain('--tt-left: 100px')
    expect(style).toContain('--tt-top: 200px')
    expect(style).toContain('--tt-offset: 12px')
    expect(style).toContain('--tt-z: 1234')
    expect(style).toContain('--tt-maxw: 300px')
  })

  it('is hidden when open is false (aria-hidden true)', () => {
    const w = mount(Tooltip, { props: { open: false, teleport: false } })
    const el = w.get('[role="tooltip"]').element as HTMLElement
    expect(el.getAttribute('aria-hidden')).toBe('true')
  })
})
