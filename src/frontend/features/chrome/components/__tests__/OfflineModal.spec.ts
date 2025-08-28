import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import OfflineModal from '../OfflineModal.vue'
import { useStatusStore } from '@/frontend/features/game/store/status'

// Stub Ui Button to a simple native button for easy interaction
vi.mock('@/frontend/ui/Button.vue', () => ({
  default: {
    name: 'UiButton',
    template: '<button class="ui-button" @click="$emit(\'click\')"><slot /></button>',
  },
}))

// Use the real Modal (teleport to body). We'll mount with attachTo: document.body

function mountOfflineModal() {
  return mount(OfflineModal, {
    attachTo: document.body,
  })
}

describe('OfflineModal', () => {
  beforeEach(() => {
    // fresh DOM and Pinia per test
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  it('opens when status.networkOk goes false', async () => {
    const wrapper = mountOfflineModal()
    const status = useStatusStore()

    // go offline
    status.setNetworkOk(false)
    await nextTick()

    const overlay = document.body.querySelector('.modal-overlay') as HTMLElement | null
    expect(overlay).not.toBeNull()
    // Content is teleported to body; wrapper.html() won't include it
    expect(document.body.textContent).toContain('Je bent offline')
  })

  it('closes when status.networkOk goes true again', async () => {
    const wrapper = mountOfflineModal()
    const status = useStatusStore()

    status.setNetworkOk(false)
    await nextTick()
    expect(document.body.querySelector('.modal-overlay')).not.toBeNull()

    // back online => should close
    status.setNetworkOk(true)
    await nextTick()

    expect(document.body.querySelector('.modal-overlay')).toBeNull()
    // wrapper still mounted
    expect(wrapper.exists()).toBe(true)
  })

  it('does not close on overlay click (closeOnOverlay=false)', async () => {
    mountOfflineModal()
    const status = useStatusStore()

    status.setNetworkOk(false)
    await nextTick()

    const overlay = document.body.querySelector('.modal-overlay') as HTMLElement
    overlay.click()
    await nextTick()

    // Still open
    expect(document.body.querySelector('.modal-overlay')).not.toBeNull()
  })

  it('Later button closes, Vernieuwen triggers window.location.reload', async () => {
    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy },
      configurable: true,
    })

    const wrapper = mountOfflineModal()
    const status = useStatusStore()
    status.setNetworkOk(false)
    await nextTick()

    const buttons = Array.from(document.body.querySelectorAll('button.ui-button')) as HTMLButtonElement[]
    const laterBtn = buttons.find((b) => b.textContent?.includes('Later'))!
    const refreshBtn = buttons.find((b) => b.textContent?.includes('Vernieuwen'))!

    // Later closes
    await laterBtn.click()
    await nextTick()
    expect(document.body.querySelector('.modal-overlay')).toBeNull()

    // Re-open, then click refresh
    status.setNetworkOk(false)
    await nextTick()
    await refreshBtn.click()
    expect(reloadSpy).toHaveBeenCalled()

    // ensure wrapper mounted
    expect(wrapper.exists()).toBe(true)
  })
})
