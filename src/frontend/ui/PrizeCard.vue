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
  backgroundImage?: string
  mediaAspect?: string | number // e.g. '16/9', '3/1', 1.777...
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

// Resolve background image: explicit prop takes precedence; otherwise use defaults per variant
const resolvedBgImageCss = computed(() => {
  const src =
    props.backgroundImage ??
    (props.variant === 'consolation'
      ? '/consolidation-bg.png'
      : props.variant === 'grand'
        ? '/grand-bg.png'
        : undefined)
  return src ? `url('${src}')` : undefined
})

// Aspect ratio for the media holder; default to 16/9
const resolvedMediaAspect = computed(() => props.mediaAspect ?? '16/9')
</script>

<template>
  <div class="prize-card" :class="variant" :aria-label="resolvedAriaLabel" role="group">
    <div
      class="card-media"
      aria-hidden="true"
      :style="
        resolvedBgImageCss
          ? {
              backgroundImage: resolvedBgImageCss,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              aspectRatio: String(resolvedMediaAspect),
            }
          : undefined
      "
    />
    <div class="card-content">
      <div class="top-row">
        <span class="count">{{ props.count }}×</span>
        <span class="amount num-tabular">{{ formatCurrency(props.amount) }}</span>
      </div>
      <div class="label">{{ resolvedLabel }}</div>
    </div>
  </div>
</template>

<style scoped>
.prize-card {
  display: grid;
  grid-template-rows: auto 1fr;
  align-items: start;
  gap: 0;
  padding: 0; /* media on top, content below */
  width: clamp(220px, 32vw, 320px);
  border-radius: var(--radius-xl);
  overflow: hidden; /* clip media to rounded corners */
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.05)) padding-box,
    var(--card-bg, var(--surface)) border-box;
  border: 1px solid var(--card-border, var(--border-subtle));
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.5) inset,
    0 4px 18px rgba(0, 0, 0, 0.12),
    0 10px 28px rgba(0, 0, 0, 0.06);
}

.card-media {
  width: 100%;
  border-radius: 0; /* corners are clipped by card */
  background: var(--card-media-bg, linear-gradient(180deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0)));
}

.card-content {
  display: grid;
  gap: 8px;
  padding: 14px 16px 16px;
}

.top-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.count {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-green);
}

.amount {
  font-family: var(--font-family-display);
  font-weight: var(--font-weight-bold);
  font-size: clamp(22px, 2.8vw, 28px);
  letter-spacing: 0.2px;
}

.label {
  font-size: var(--fs-small);
  opacity: 0.95;
}

/* Variant palettes */
.prize-card.grand {
  --card-bg: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent-gold) 70%, #fff) 0%,
    color-mix(in srgb, var(--color-accent-gold) 35%, #fff) 45%,
    color-mix(in srgb, var(--color-accent-gold) 60%, var(--surface)) 100%
  );
  --card-border: color-mix(in srgb, var(--color-accent-gold) 65%, var(--border-subtle));
  --card-media-bg: linear-gradient(180deg, rgba(218, 165, 32, 0.15), rgba(218, 165, 32, 0));
}

.prize-card.consolation {
  --card-bg: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary-green) 30%, #fff) 0%,
    color-mix(in srgb, var(--color-primary-green) 18%, #fff) 45%,
    color-mix(in srgb, var(--color-primary-green) 35%, var(--surface)) 100%
  );
  --card-border: color-mix(in srgb, var(--color-primary-green) 45%, var(--border-subtle));
  --card-media-bg: linear-gradient(180deg, rgba(0, 128, 0, 0.12), rgba(0, 128, 0, 0));
}

@media (max-width: 520px) {
  .prize-card {
    grid-template-columns: 1fr;
    grid-template-areas: 'content';
    padding: 12px;
  }
  .card-media {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .prize-card {
    transition: none;
  }
}
</style>
