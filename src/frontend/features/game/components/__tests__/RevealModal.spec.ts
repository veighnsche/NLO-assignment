import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import RevealModal from '../RevealModal.vue'

// Stub Modal and Button to avoid external UI complexity
vi.mock('@/frontend/ui/Modal.vue', () => ({
  default: {
    name: 'Modal',
    props: ['modelValue', 'ariaLabelledby'],
    emits: ['update:modelValue'],
    template: '<div class="modal"><slot /><slot name="footer" /></div>',
  },
}))

vi.mock('@/frontend/ui/Button.vue', () => ({
  default: { name: 'Button', template: '<button @click="$emit(\'click\')"><slot /></button>' },
}))

describe('RevealModal.vue', () => {
  it('shows confirm step, performs reveal, and shows result then closes', async () => {
    const performReveal = vi.fn().mockResolvedValue({ type: 'consolation', amount: 100 })

    const wrapper = mount(RevealModal, {
      props: {
        modelValue: true,
        pending: { id: '1', row: 2, col: 3 },
        performReveal,
        'onUpdate:modelValue': (v: boolean) => wrapper.setProps({ modelValue: v }),
        onClosed: vi.fn(),
      },
    })

    // Confirm step visible
    expect(wrapper.text()).toContain('Vakje openen bevestigen')
    expect(wrapper.text()).toContain('Rij 2, Kolom 3')

    // Click Openen (confirm)
    const buttons = wrapper.findAll('button')
    const confirmBtn = buttons.at(1)
    expect(confirmBtn?.text()).toContain('Openen')
    await confirmBtn?.trigger('click')

    // Wait for async flow to settle
    await nextTick()
    await Promise.resolve()

    // Result step visible
    expect(performReveal).toHaveBeenCalledWith('1')
    expect(wrapper.text()).toContain('Uitslag')

    // Click close button in result footer
    const closeBtn = wrapper.find('button')
    await closeBtn.trigger('click')
    await nextTick()

    // v-model should be set to false
    expect(wrapper.props('modelValue')).toBe(false)
  })
})
