<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGridStore } from '@/frontend/features/game/store/grid'

const grid = useGridStore()

// Derived metrics locally to avoid prop drilling
const openedCount = computed(() => grid.openedCount)
const total = computed(() => grid.total)
const consolationTotal = computed(() => grid.consolationTotal)
const consolationOpenedCount = computed(
  () =>
    grid.revealed.filter(
      (c: { prize?: { type?: 'consolation' | 'grand' | 'none' } }) =>
        c.prize?.type === 'consolation',
    ).length,
)
const grandOpened = computed(() =>
  grid.revealed.some(
    (c: { prize?: { type?: 'consolation' | 'grand' | 'none' } }) => c.prize?.type === 'grand',
  ),
)
const canOpen = computed(
  () => !grid.isRevealing && !grid.userHasRevealed() && grid.openedCount < grid.total,
)
</script>

<template>
  <div class="metrics-sticky">
    <div class="meta-row" role="group" aria-label="Spelstatistieken">
      <div class="metric opened" aria-label="Aantal geopende vakjes">
        <Icon class="emoji" icon="mdi:archive-outline" aria-hidden="true" />
        <span class="label">Geopend:</span>
        <span class="value">{{ openedCount }} / {{ total }}</span>
      </div>

      <div class="metric consolation" aria-label="Aantal geopende troostprijzen">
        <Icon class="emoji" icon="mdi:gift" aria-hidden="true" />
        <span class="label">Troostprijzen:</span>
        <span class="value">{{ consolationOpenedCount }} / {{ consolationTotal }}</span>
      </div>

      <div
        class="metric grand"
        :class="{ active: grandOpened }"
        :aria-live="grandOpened ? 'polite' : undefined"
        aria-label="Status hoofdprijs"
      >
        <Icon class="emoji" icon="mdi:diamond-stone" aria-hidden="true" />
        <span class="label">Hoofdprijs:</span>
        <span class="value">{{ grandOpened ? 'Geopend' : 'Nog verborgen' }}</span>
        <span v-if="grandOpened" class="burst" aria-hidden="true"></span>
      </div>

      <div
        class="metric can-open"
        :class="{ closed: !canOpen }"
        aria-label="Kan gebruiker nog een vakje openen?"
      >
        <Icon class="emoji" :icon="canOpen ? 'mdi:lock-open-variant' : 'mdi:lock-outline'" aria-hidden="true" />
        <span class="label">Kan openen:</span>
        <span class="value">{{ canOpen ? 'Ja' : 'Nee' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metrics-sticky {
  /* Sticky positioning beneath TopBar (56px) */
  position: sticky;
  top: 56px;
  z-index: 10;
  padding: 0.5rem 1rem;
  background: transparent; /* fully transparent */
  pointer-events: none; /* allow clicks to pass through to the grid */
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 0.5rem 0;
}

.metric {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  /* Semi-transparent chip with subtle glass effect */
  background: color-mix(in srgb, var(--surface-elevated) 65%, transparent);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
  color: color-mix(in srgb, var(--text) 85%, var(--color-silver));
  font-size: 0.9rem;
  -webkit-backdrop-filter: saturate(1.1) blur(2px);
  backdrop-filter: saturate(1.1) blur(2px);
}

.metric .emoji {
  font-size: 1rem;
}
.metric .label {
  font-weight: 600;
  color: var(--text);
}
.metric .value {
  font-variant-numeric: tabular-nums;
}

.metric.consolation {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-green) 55%, white);
  background: color-mix(in srgb, var(--color-primary-green) 25%, transparent);
}

.metric.grand {
  position: relative;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 60%, black);
  background: color-mix(in srgb, var(--color-accent-gold) 30%, transparent);
}

.metric.grand.active {
  color: black;
  background: color-mix(in srgb, var(--color-accent-gold) 45%, transparent);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 80%, black),
    0 0 0 3px color-mix(in srgb, var(--color-accent-gold) 25%, transparent),
    0 8px 24px color-mix(in srgb, var(--color-accent-gold) 25%, transparent);
  animation: grandGlow 1.8s ease-in-out infinite alternate;
}

.metric.grand .burst {
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 35%, rgba(255, 255, 255, 0.7), transparent 35%),
    radial-gradient(circle at 80% 65%, rgba(255, 255, 255, 0.5), transparent 40%);
  filter: blur(2px);
}

@keyframes grandGlow {
  from {
    filter: drop-shadow(0 0 0px rgba(255, 215, 0, 0));
  }
  to {
    filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.45));
  }
}

/* Can-open metric styling */
.metric.can-open {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-green) 50%, white);
  background: color-mix(in srgb, var(--color-primary-green) 20%, transparent);
}
.metric.can-open.closed {
  box-shadow: inset 0 0 0 1px var(--border-subtle);
  background: color-mix(in srgb, var(--surface-elevated) 55%, transparent);
  color: color-mix(in srgb, var(--text) 60%, var(--color-silver));
}
</style>
