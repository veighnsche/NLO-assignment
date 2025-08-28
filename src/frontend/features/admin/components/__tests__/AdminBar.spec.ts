import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

// Stubs for UI components used by AdminBar
const ButtonStub = {
  // Pass through attrs so tests can query aria-label etc.
  template: '<button type="button" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
}
const ModalStub = {
  props: { modelValue: { type: Boolean, default: false }, ariaLabelledby: { type: String, default: '' } },
  emits: ['update:modelValue'],
  template:
    '<div v-if="modelValue" class="modal-stub"><slot /><div class="footer"><slot name="footer" /></div></div>',
}
const SliderStub = {
  template: '<div class="slider-stub"><slot /></div>',
}

// Mocks for Pinia stores consumed by AdminBar
let adminUiStoreMock: any
vi.mock('@/frontend/features/admin/store/adminUI', () => ({
  useAdminUiStore: () => adminUiStoreMock,
}))
const refreshCurrentPlayerMock = vi.fn()
vi.mock('@/frontend/features/game/store/session', () => ({
  useSessionStore: () => ({ activePlayerName: '', refreshCurrentPlayer: refreshCurrentPlayerMock, userNameById: () => '' }),
}))
vi.mock('@/frontend/features/game/store/status', () => ({
  useStatusStore: () => ({ isBooting: false }),
}))

// Will be dynamically set per-test
let controls: any
vi.mock('@/frontend/features/admin/useAdminControls', () => ({
  useAdminControls: () => controls,
}))

// Import after mocks
import AdminBar from '@/frontend/features/admin/components/AdminBar.vue'
import ToastContainer from '@/frontend/ui/ToastContainer.vue'

function mountAdminBar() {
  return mount({
    components: { AdminBar, ToastContainer },
    template: '<div><AdminBar /><ToastContainer /></div>',
  }, {
    global: {
      plugins: [createPinia()],
      stubs: {
        Button: ButtonStub,
        Modal: ModalStub,
        Slider: SliderStub,
        Icon: true,
      },
    },
  })
}

beforeEach(() => {
  // Reset a reactive admin UI store mock each test so template reacts to changes
  adminUiStoreMock = reactive({
    showExposed: false,
    toggleExposed: vi.fn((force?: boolean) => {
      if (typeof force === 'boolean') {
        adminUiStoreMock.showExposed = force
      } else {
        adminUiStoreMock.showExposed = !adminUiStoreMock.showExposed
      }
    }),
  })
  controls = {
    reset: vi.fn().mockResolvedValue(undefined),
    setBotSpeed: vi.fn().mockResolvedValue(undefined),
    getBotDelay: vi.fn().mockResolvedValue({ minMs: 500, maxMs: 1500 }),
    getTargets: vi.fn().mockResolvedValue([]),
    pickRandomPlayer: vi.fn().mockResolvedValue(undefined),
  }
})

describe('AdminBar toasts', () => {
  it('emits toggle when close button clicked', async () => {
    const wrapper = mountAdminBar()
    const closeBtn = wrapper.find('button[aria-label="Sluit adminbalk"]')
    expect(closeBtn.exists()).toBe(true)
    await closeBtn.trigger('click')
    const comp = wrapper.findComponent(AdminBar)
    expect(comp.emitted('toggle')).toBeTruthy()
  })

  it('opens reset modal and confirms with seed', async () => {
    const wrapper = mountAdminBar()
    // Open modal
    const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset spel'))
    expect(resetBtn).toBeTruthy()
    await (resetBtn as any)!.trigger('click')

    // Modal content visible
    const title = wrapper.find('#reset-title')
    expect(title.exists()).toBe(true)

    // Set seed and confirm
    const input = wrapper.find('input[type="number"]')
    await input.setValue('42')

    const confirm = wrapper.findAll('button').find((b) => b.text().includes('Resetten'))
    expect(confirm).toBeTruthy()
    await (confirm as any)!.trigger('click')

    expect(controls.reset).toHaveBeenCalledWith(42)
    expect(refreshCurrentPlayerMock).toHaveBeenCalled()
  })

  it('shows success toast when picking random player succeeds', async () => {
    const wrapper = mountAdminBar()
    const buttons = wrapper.findAll('button')
    const pickBtn = buttons.find((b) => b.text().includes('Verander van speler'))!
    await pickBtn.trigger('click')

    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('Nieuwe speler geselecteerd')
  })

  it('shows error toast when picking random player fails', async () => {
    controls.pickRandomPlayer.mockRejectedValueOnce(new Error('fail'))
    const wrapper = mountAdminBar()
    const pickBtn = wrapper.findAll('button').find((b) => b.text().includes('Verander van speler'))!
    await pickBtn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('Geen speler kunnen selecteren')
  })

  it('shows success toast on reset success', async () => {
    const wrapper = mountAdminBar()
    // Open modal
    const resetOpenBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset spel'))!
    await resetOpenBtn.trigger('click')
    // Click confirm in modal
    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Resetten'))!
    await confirmBtn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('Spel gereset')
  })

  it('shows error toast on reset failure', async () => {
    controls.reset.mockRejectedValueOnce(new Error('fail'))
    const wrapper = mountAdminBar()
    const resetOpenBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset spel'))!
    await resetOpenBtn.trigger('click')
    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Resetten'))!
    await confirmBtn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('Reset mislukt')
  })

  it('toasts on reset bot speed success/failure', async () => {
    const wrapper = mountAdminBar()
    // Success path
    let btn = wrapper.findAll('button').find((b) => b.text().includes('Reset snelheid'))!
    await btn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('Botsnelheid hersteld')

    // Failure path
    controls.setBotSpeed.mockRejectedValueOnce(new Error('fail'))
    btn = wrapper.findAll('button').find((b) => b.text().includes('Reset snelheid'))!
    await btn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('Herstellen botsnelheid mislukt')
  })

  it('resets expose button label to default after game reset', async () => {
    const wrapper = mountAdminBar()
    // Initially should show "Toon prijzen"
    let exposeBtn = wrapper.findAll('button').find((b) => /Toon prijzen/i.test(b.text()))
    expect(exposeBtn).toBeTruthy()

    // Simulate prizes exposed -> label becomes "Verberg prijzen"
    adminUiStoreMock.showExposed = true
    await nextTick()
    exposeBtn = wrapper.findAll('button').find((b) => /Verberg prijzen/i.test(b.text()))
    expect(exposeBtn).toBeTruthy()

    // Open reset modal
    const resetOpenBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset spel'))!
    await resetOpenBtn.trigger('click')

    // Make reset implementation also reset the store toggle (simulating implementation)
    controls.reset.mockImplementationOnce(async () => {
      adminUiStoreMock.toggleExposed(false)
    })

    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Resetten'))!
    await confirmBtn.trigger('click')
    await nextTick()

    // Button label should be back to default
    exposeBtn = wrapper.findAll('button').find((b) => /Toon prijzen/i.test(b.text()))
    expect(exposeBtn).toBeTruthy()
  })
})
