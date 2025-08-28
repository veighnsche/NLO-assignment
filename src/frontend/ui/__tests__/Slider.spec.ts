import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Slider from '../Slider.vue'

describe('Slider', () => {
  it('renders label, input and value with suffix', () => {
    const w = mount(Slider, {
      props: { modelValue: 1.5, label: 'Speed', suffix: 'x', decimals: 1 },
    })
    expect(w.find('.label').text()).toBe('Speed')
    expect(w.find('input[type="range"]').exists()).toBe(true)
    expect(w.find('.value').text()).toBe('1.5x')
  })

  it('emits update and input on change', async () => {
    const w = mount(Slider, { props: { modelValue: 1, step: 0.1 } })
    const input = w.get('input')
    // change v-model via setValue to trigger @input and model update
    await input.setValue('2')
    const upd = w.emitted()['update:modelValue']?.at(-1)
    const inp = w.emitted()['input']?.at(-1)
    expect(upd).toEqual([2])
    expect(inp).toEqual([2])
  })

  it('syncs internal localValue when prop changes', async () => {
    const w = mount(Slider, { props: { modelValue: 3 } })
    await w.setProps({ modelValue: 4 })
    expect((w.get('input').element as HTMLInputElement).value).toBe('4')
  })

  it('computes aria-label from label when provided', () => {
    const w = mount(Slider, { props: { modelValue: 1, label: 'Volume' } })
    expect(w.get('input').attributes('aria-label')).toBe('Volume')
  })
})
