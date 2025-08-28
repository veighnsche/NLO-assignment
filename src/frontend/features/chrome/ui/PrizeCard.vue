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
        <span class="count chip" aria-label="Aantal">{{ props.count }}×</span>
        <span class="amount num-tabular">{{ formatCurrency(props.amount) }}</span>
      </div>
      <div class="divider" role="presentation" />
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
  gap: 6px;
  padding: 8px 10px 10px;
}

.top-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}

.count {
  font-weight: var(--font-weight-semibold);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--chip-bg, color-mix(in srgb, var(--surface-contrast) 6%, transparent));
  border: 1px solid var(--chip-border, var(--border-subtle));
  color: var(--chip-fg, currentColor);
  line-height: 1.2;
}

.amount {
  font-family: var(--font-family-display);
  font-weight: var(--font-weight-bold);
  font-size: clamp(18px, 2.2vw, 24px);
  letter-spacing: 0.2px;
  line-height: 1.1;
}

.divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--border-subtle) 70%, transparent) 15%,
    color-mix(in srgb, var(--border-subtle) 80%, transparent) 85%,
    transparent 100%
  );
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
  --chip-bg: color-mix(in srgb, var(--color-accent-gold) 15%, #fff);
  --chip-border: color-mix(in srgb, var(--color-accent-gold) 45%, var(--border-subtle));
  --chip-fg: color-mix(in srgb, var(--color-accent-gold) 40%, #2b2100);
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
  --chip-bg: color-mix(in srgb, var(--color-primary-green) 12%, #fff);
  --chip-border: color-mix(in srgb, var(--color-primary-green) 38%, var(--border-subtle));
  --chip-fg: color-mix(in srgb, var(--color-primary-green) 35%, #062b12);
}

@media (max-width: 520px) {
  .prize-card {
    grid-template-columns: 1fr;
    grid-template-areas: 'content';
    padding: 8px;
  }
  .card-media {
    display: none;
  }
  .card-content {
    padding: 8px 8px 10px;
    gap: 4px;
  }
  .divider {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .prize-card {
    transition: none;
  }
}
</style>
