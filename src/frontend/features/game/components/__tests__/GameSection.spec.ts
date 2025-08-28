import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import GameSection from '../GameSection.vue'

// Stub child components to keep it light
vi.mock('../GameMetrics.vue', () => ({
  default: { name: 'GameMetrics', inheritAttrs: false, template: '<div class="metrics-stub" />' },
}))
vi.mock('../CalendarGrid.vue', () => ({
  default: {
    name: 'CalendarGrid',
    inheritAttrs: false,
    props: ['tooltip'],
    emits: ['request-reveal'],
    template: `<div class="grid-stub" @click="$emit('request-reveal', { id: '1', row: 1, col: 2 })"></div>`,
  },
}))

vi.mock('../GridTooltip.vue', () => ({
  default: {
    name: 'GridTooltip',
    inheritAttrs: false,
    template: `<div class="tooltip-stub"></div>`,
  },
}))

vi.mock('../RevealModal.vue', () => ({
  default: {
    name: 'RevealModal',
    inheritAttrs: false,
    props: ['modelValue', 'pending', 'performReveal'],
    emits: ['update:modelValue', 'closed'],
    template: `<div class="reveal-stub">
        <span class="pending" v-if="pending">{{ pending.row }}-{{ pending.col }}</span>
        <button class="close" @click="$emit('update:modelValue', false); $emit('closed')">close</button>
      </div>`,
  },
}))

describe('GameSection.vue', () => {
  it('renders the game section', async () => {
    const wrapper = mount(GameSection)

    // Has section wrapper
    expect(wrapper.find('section.game-section').exists()).toBe(true)
  })
})
