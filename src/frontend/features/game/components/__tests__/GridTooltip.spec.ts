import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import GridTooltip from '../GridTooltip.vue'

vi.mock('@iconify/vue', () => ({
  Icon: { name: 'Icon', template: '<i />' },
}))

vi.mock('@/frontend/features/game/composables/useGridTooltip', () => {
  const open = ref(true)
  const x = ref(100)
  const y = ref(200)
  const text = ref('Rij 1, Kolom 2')
  const opener = ref('Alice')
  const revealed = ref(true)
  const prizeLabel = ref('Hoofdprijs')
  const prizeAmountText = ref('€25.000')
  const prizeClass = ref('prize--grand')
  const statusClass = ref('status--open')
  const whenText = ref('vandaag')
  const onHover = vi.fn()
  const onMove = vi.fn()
  const onLeave = vi.fn()
  return {
    useGridTooltip: () => ({
      open, x, y, text, opener, revealed,
      prizeLabel, prizeAmountText, prizeClass, statusClass, whenText,
      onHover, onMove, onLeave,
    }),
  }
})

// Stub Tooltip container to a simple div mirroring slot
vi.mock('@/frontend/ui/Tooltip.vue', () => ({
  default: { name: 'Tooltip', template: '<div><slot /></div>', props: ['open', 'x', 'y', 'placement', 'offset', 'maxWidth'] },
}))

describe('GridTooltip.vue', () => {
  it('renders tooltip content from composable state', () => {
    const wrapper = mount(GridTooltip)
    expect(wrapper.text()).toContain('Rij 1, Kolom 2')
    expect(wrapper.text()).toContain('Geopend door:')
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Status:')
    expect(wrapper.text()).toContain('Geopend')
    expect(wrapper.text()).toContain('Prijs:')
    expect(wrapper.text()).toContain('Hoofdprijs')
    expect(wrapper.text()).toContain('€25.000')
  })
})
