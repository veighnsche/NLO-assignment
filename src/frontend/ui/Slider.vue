<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <label class="slider">
    <span v-if="label" class="label">{{ label }}</span>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      v-model.number="localValue"
      @input="onInput"
      :aria-label="ariaLabel"
    />
    <span v-if="showValue" class="value">{{ displayValue }}{{ suffix }}</span>
  </label>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    label?: string
    suffix?: string
    showValue?: boolean
    decimals?: number
  }>(),
  {
    min: 0.3,
    max: 10,
    step: 0.1,
    label: '',
    suffix: '',
    showValue: true,
    decimals: 0,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'input', value: number): void
}>()

const localValue = ref<number>(props.modelValue)

watch(
  () => props.modelValue,
  (nv) => {
    if (nv !== localValue.value) localValue.value = nv
  },
)

function onInput() {
  const v = Number(localValue.value)
  emit('update:modelValue', v)
  emit('input', v)
}

const displayValue = computed(() => {
  const d = Number(props.decimals)
  if (Number.isFinite(d) && d >= 0 && d <= 10) return localValue.value.toFixed(d)
  return String(localValue.value)
})

const ariaLabel = computed(() => (props.label ? props.label : 'Slider'))
</script>

<style scoped>
.slider {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap; /* keep label, input, and value in one line */
}

input[type='range'] {
  width: 220px;
}

.label {
  font-weight: 600;
}

.value {
  font-variant-numeric: tabular-nums;
  white-space: nowrap; /* keep number and suffix together */
}
</style>
