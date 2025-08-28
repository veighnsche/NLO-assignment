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
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    'count amount'
    'count label';
  align-items: center;
  column-gap: 12px;
  row-gap: 3px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  /* Premium layered background */
  background:
    linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05)) padding-box,
    var(--badge-bg, var(--surface)) border-box;
  border: 1px solid var(--badge-border, var(--border-subtle));
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.5) inset,
    0 1px 8px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.06);
  transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}

/* Subtle sheen */
.prize-badge::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 40%);
  pointer-events: none;
}

.prize-badge:where(:hover) {
  transform: translateY(-1px);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.6) inset,
    0 6px 18px rgba(0, 0, 0, 0.12),
    0 10px 24px rgba(0, 0, 0, 0.08);
}

.prize-badge:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--color-accent-gold) 65%, white);
  outline-offset: 2px;
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
  font-size: clamp(20px, 2.6vw, 26px);
  letter-spacing: 0.2px;
}
.prize-badge .label {
  grid-area: label;
  font-size: var(--fs-small);
  opacity: 0.9;
}
/* Variant palettes with metallic accents */
.prize-badge.grand {
  --badge-bg: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-accent-gold) 70%, #fff) 0%,
      color-mix(in srgb, var(--color-accent-gold) 35%, #fff) 45%,
      color-mix(in srgb, var(--color-accent-gold) 60%, var(--surface)) 100%
    );
  --badge-border: color-mix(in srgb, var(--color-accent-gold) 65%, var(--border-subtle));
}

.prize-badge.consolation {
  --badge-bg: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-primary-green) 30%, #fff) 0%,
      color-mix(in srgb, var(--color-primary-green) 18%, #fff) 45%,
      color-mix(in srgb, var(--color-primary-green) 35%, var(--surface)) 100%
    );
  --badge-border: color-mix(in srgb, var(--color-primary-green) 45%, var(--border-subtle));
}

@media (prefers-reduced-motion: reduce) {
  .prize-badge {
    transition: none;
  }
  .prize-badge:where(:hover) {
    transform: none;
  }
}
</style>
