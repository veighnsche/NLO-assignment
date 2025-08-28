<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/frontend/lib/format'

type Variant = 'consolation' | 'grand'

const props = defineProps<{
  variant: Variant
  count: number
  amount: number
  label?: string
  ariaLabel?: string
}>()

const fallbackLabel = computed(() => (props.variant === 'grand' ? 'hoofdprijs' : 'troostprijs'))
const resolvedLabel = computed(() => props.label ?? fallbackLabel.value)

const resolvedAriaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel
  if (props.variant === 'grand') {
    return 'Eén hoofdprijs van 25.000 euro'
  }
  return 'Honderd troostprijzen van 100 euro'
})
</script>

<template>
  <div class="prize-badge" :class="variant" :aria-label="resolvedAriaLabel">
    <span class="count">{{ props.count }}×</span>
    <span class="amount num-tabular">{{ formatCurrency(props.amount) }}</span>
    <span class="label">{{ resolvedLabel }}</span>
  </div>
</template>

<style scoped>
.prize-badge {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    'count amount'
    'count label';
  align-items: center;
  column-gap: 10px;
  row-gap: 2px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}
.prize-badge .count {
  grid-area: count;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-green);
}
.prize-badge .amount {
  grid-area: amount;
  font-family: var(--font-family-display);
  font-weight: var(--font-weight-bold);
  font-size: clamp(18px, 2.4vw, 24px);
}
.prize-badge .label {
  grid-area: label;
  font-size: var(--fs-small);
  opacity: 0.85;
}
.prize-badge.grand {
  background: color-mix(in srgb, var(--color-accent-gold) 16%, var(--surface));
  border-color: color-mix(in srgb, var(--color-accent-gold) 60%, var(--border-subtle));
}
.prize-badge.consolation {
  background: color-mix(in srgb, var(--color-primary-green) 12%, var(--surface));
  border-color: color-mix(in srgb, var(--color-primary-green) 45%, var(--border-subtle));
}
</style>
