import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminBar from '../AdminBar.vue'

// Mocks
const resetMock = vi.fn()
const setBotSpeedMock = vi.fn()
const getBotDelayMock = vi.fn(async () => ({ minMs: 500, maxMs: 1500 }))
const pickRandomPlayerMock = vi.fn()
const toggleExposedMock = vi.fn()
const refreshCurrentPlayerMock = vi.fn()

vi.mock('@/frontend/features/admin/useAdminControls', () => ({
  useAdminControls: () => ({
    reset: resetMock,
    setBotSpeed: setBotSpeedMock,
    getBotDelay: getBotDelayMock,
    pickRandomPlayer: pickRandomPlayerMock,
  }),
}))

vi.mock('@/frontend/features/admin/store/adminUI', () => ({
  useAdminUiStore: () => ({
    showExposed: false,
    toggleExposed: toggleExposedMock,
  }),
}))

vi.mock('@/frontend/features/game/store/session', () => ({
  useSessionStore: () => ({
    activePlayerName: 'Alice',
    refreshCurrentPlayer: refreshCurrentPlayerMock,
  }),
}))

vi.mock('@/frontend/features/game/store/status', () => ({
  useStatusStore: () => ({
    isBooting: false,
  }),
}))

// Stubs
vi.mock('@/frontend/ui/Button.vue', () => ({
  default: {
    name: 'Button',
    inheritAttrs: false,
    emits: ['click'],
    template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  },
}))

vi.mock('@/frontend/ui/Slider.vue', () => ({
  default: {
    name: 'Slider',
    props: ['modelValue', 'min', 'max', 'step', 'label', 'suffix', 'decimals'],
    emits: ['update:modelValue', 'input'],
    template: '<input class="slider-stub" type="range" :min="min" :max="max" :step="step" :value="modelValue" @input="$emit(\'input\')" />',
  },
}))

vi.mock('@/frontend/ui/Modal.vue', () => ({
  default: {
    name: 'Modal',
    props: {
      modelValue: { type: Boolean, default: false },
      ariaLabelledby: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    template: `
      <div v-if="modelValue" class="modal-stub" role="dialog" :aria-labelledby="ariaLabelledby">
        <slot />
        <div class="footer"><slot name="footer" /></div>
      </div>
    `,
  },
}))

describe('AdminBar.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits toggle when close button clicked', async () => {
    const wrapper = mount(AdminBar)
    const closeBtn = wrapper.find('button[aria-label="Sluit adminbalk"]')
    expect(closeBtn.exists()).toBe(true)
    await closeBtn.trigger('click')
    expect(wrapper.emitted('toggle')).toBeTruthy()
  })

  it('opens reset modal and confirms with seed', async () => {
    const wrapper = mount(AdminBar)

    // Open modal
    const resetBtn = wrapper.find('button')
    // Find the button with visible text 'Reset spel…'
    const button = wrapper.findAll('button').find((b) => b.text().includes('Reset spel'))
    expect(button).toBeTruthy()
    await (button as any)!.trigger('click')

    // Modal content visible
    const title = wrapper.find('#reset-title')
    expect(title.exists()).toBe(true)

    // Set seed and confirm
    const input = wrapper.find('input[type="number"]')
    await input.setValue('42')

    const confirm = wrapper.findAll('button').find((b) => b.text().includes('Resetten'))
    expect(confirm).toBeTruthy()
    await (confirm as any)!.trigger('click')

    expect(resetMock).toHaveBeenCalledWith(42)
    expect(refreshCurrentPlayerMock).toHaveBeenCalled()
  })
})
