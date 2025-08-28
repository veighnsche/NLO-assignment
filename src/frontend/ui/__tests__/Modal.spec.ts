import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '../Modal.vue'
import { nextTick } from 'vue'

function mountModal(
  props: any = {},
  slots: any = {
    default: '<button id="inside">OK</button>',
    footer: '<button id="footer">Close</button>',
  },
) {
  return mount(Modal, {
    attachTo: document.body, // ensure Teleport target exists
    props: { modelValue: false, ...props },
    slots,
  })
}

describe('UiModal', () => {
  const flush = async () => {
    await nextTick()
    await Promise.resolve()
  }
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  it('renders when modelValue is true and emits open', async () => {
    const onOpen = vi.fn()
    mountModal({ modelValue: true, onOpen })
    await flush()
    // modal content teleported into body
    const overlay = document.body.querySelector('.modal-overlay') as HTMLElement
    expect(overlay).toBeTruthy()
    expect(onOpen).toHaveBeenCalled()
    // body scroll is managed by component; not asserting exact CSS value in JSDOM
  })

  it('overlay click closes when closeOnOverlay not false', async () => {
    const w = mountModal({ modelValue: true, closeOnOverlay: true })
    await flush()
    const overlay = document.body.querySelector('.modal-overlay') as HTMLElement
    const evt = new MouseEvent('click', { bubbles: true, cancelable: true })
    overlay.dispatchEvent(evt)
    await flush()
    const emits = (w.emitted()['update:modelValue'] || []) as any[]
    expect(emits.length).toBeGreaterThan(0)
    expect(emits.at(-1)).toEqual([false])
  })

  it('overlay click does not close when closeOnOverlay is false', async () => {
    const w = mountModal({ modelValue: true, closeOnOverlay: false })
    const overlay = document.body.querySelector('.modal-overlay') as HTMLElement
    overlay.click()
    await flush()
    const emits = w.emitted()['update:modelValue'] || []
    expect(emits.length).toBe(0)
  })

  it('ESC key closes and emits close, and restores scroll', async () => {
    const onClose = vi.fn()
    const w = mountModal({ modelValue: true, onClose })
    await flush()
    const dialog = document.body.querySelector('.modal') as HTMLElement
    const evt = new KeyboardEvent('keydown', { key: 'Escape' })
    dialog.dispatchEvent(evt)
    await flush()
    // modelValue updated to false
    const emits = (w.emitted()['update:modelValue'] || []) as any[]
    expect(emits.at(-1)).toEqual([false])
    // when modelValue flips false, component emits close and unlocks scroll
    // we need to simulate the prop change as the parent would do
    await w.setProps({ modelValue: false })
    expect(onClose).toHaveBeenCalled()
    expect(document.body.style.overflow).toBe('')
  })

  it('tabs focus cycles inside modal', async () => {
    const w = mountModal(
      { modelValue: true },
      { default: '<button id="a">A</button><button id="b">B</button>' },
    )
    await flush()
    const dialog = document.body.querySelector('.modal') as HTMLElement
    const a = dialog.querySelector('#a') as HTMLButtonElement
    const b = dialog.querySelector('#b') as HTMLButtonElement
    a.focus()
    const tab = new KeyboardEvent('keydown', { key: 'Tab' })
    dialog.dispatchEvent(tab)
    expect(document.activeElement).toBe(b)
    const shiftTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
    dialog.dispatchEvent(shiftTab)
    expect(document.activeElement).toBe(a)
  })
})
