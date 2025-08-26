<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  title?: string
  openedCount: number
  total: number
  consolationOpenedCount: number
  grandOpened: boolean
  consolationTotal: number
}>()
</script>

<template>
  <header class="game-header">
    <h2>{{ props.title ?? 'Verrassingskalender' }}</h2>
    <div class="meta-row" role="group" aria-label="Spelstatistieken">
      <div class="metric opened" aria-label="Aantal geopende vakjes">
        <span class="emoji" aria-hidden="true">📦</span>
        <span class="label">Geopend:</span>
        <span class="value">{{ props.openedCount }} / {{ props.total }}</span>
      </div>

      <div class="metric consolation" aria-label="Aantal geopende troostprijzen">
        <span class="emoji" aria-hidden="true">🎁</span>
        <span class="label">Troostprijzen:</span>
        <span class="value">{{ props.consolationOpenedCount }} / {{ props.consolationTotal }}</span>
      </div>

      <div
        class="metric grand"
        :class="{ active: props.grandOpened }"
        :aria-live="props.grandOpened ? 'polite' : undefined"
        aria-label="Status hoofdprijs"
      >
        <span class="emoji" aria-hidden="true">💎</span>
        <span class="label">Hoofdprijs:</span>
        <span class="value">{{ props.grandOpened ? 'Geopend' : 'Nog verborgen' }}</span>
        <span v-if="props.grandOpened" class="burst" aria-hidden="true"></span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.game-header {
  padding: 1rem 1rem 0.5rem 1rem;
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
  background: color-mix(in srgb, var(--surface-alt) 90%, white);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
  color: color-mix(in srgb, var(--text) 75%, var(--color-silver));
  font-size: 0.9rem;
}

.metric .emoji { font-size: 1rem; }
.metric .label { font-weight: 600; color: var(--text); }
.metric .value { font-variant-numeric: tabular-nums; }

.metric.consolation {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-green) 55%, white);
  background: color-mix(in srgb, var(--color-primary-green) 10%, white);
}

.metric.grand {
  position: relative;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 60%, black);
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent-gold) 18%, white), white 60%);
}

.metric.grand.active {
  color: black;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--color-accent-gold) 45%, white),
    color-mix(in srgb, var(--color-accent-gold) 75%, white) 60%);
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
  background: radial-gradient(circle at 20% 35%, rgba(255,255,255,0.7), transparent 35%),
              radial-gradient(circle at 80% 65%, rgba(255,255,255,0.5), transparent 40%);
  filter: blur(2px);
}

@keyframes grandGlow {
  from { filter: drop-shadow(0 0 0px rgba(255, 215, 0, 0.0)); }
  to   { filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.45)); }
}

h2 {
  margin: 0 0 0.25rem 0;
  color: var(--color-primary-green);
  position: relative;
  padding-bottom: 0.25rem;
}

/* Gold underline accent */
h2::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 64px;
  height: 3px;
  background: var(--color-accent-gold);
  border-radius: var(--radius-sm);
}
</style>
