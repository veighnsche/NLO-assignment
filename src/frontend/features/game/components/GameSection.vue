<script setup lang="ts">
import { ref } from 'vue'
import GameMetrics from './GameMetrics.vue'
import CalendarGrid from './CalendarGrid.vue'
import GridTooltip from './GridTooltip.vue'
import RevealModal from './RevealModal.vue'
import type { GridTooltipApi } from '@/frontend/features/game/composables/useGridTooltip'

// Tooltip instance owned here and passed down to grid as an imperative API
const tooltipRef = ref<GridTooltipApi | null>(null)

// CalendarGrid instance to call exposed performReveal from the modal
const gridRef = ref<InstanceType<typeof CalendarGrid> | null>(null)

// Modal ownership: pending selection and open state
const confirmOpen = ref(false)
const pending = ref<{ id: string; row: number; col: number } | null>(null)

function onRequestReveal(payload: { id: string; row: number; col: number }) {
  pending.value = payload
  confirmOpen.value = true
}

async function proxyPerformReveal(id: string) {
  // Delegate to grid's exposed performReveal with safety check
  const api = gridRef.value
  if (!api) throw new Error('Grid is not ready')
  return await api.performReveal(id)
}

function onModalClosed() {
  pending.value = null
}
</script>

<template>
  <section class="game-section" aria-label="Spel">
    <div class="metrics-sticky" aria-hidden="false">
      <GameMetrics />
    </div>
    <CalendarGrid ref="gridRef" :tooltip="tooltipRef" @request-reveal="onRequestReveal" />
  </section>
  <!-- Tooltip instance is hoisted here to avoid any coupling to the 10k grid subtree -->
  <GridTooltip ref="tooltipRef" />
  <!-- Reveal modal is owned here -->
  <RevealModal
    v-model="confirmOpen"
    :pending="pending"
    :performReveal="proxyPerformReveal"
    @closed="onModalClosed"
  />
</template>

<style scoped>
.game-section {
  padding: 1rem;
  /* Decorative gold accent at the top implemented as a background stripe */
  background:
    linear-gradient(var(--color-accent-gold), var(--color-accent-gold)) top / 100% 4px no-repeat,
    var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  position: relative;
  margin-top: 1rem; /* space above the card */
  /* Constrain width and keep gutters from screen edges */
  width: min(100% - calc(var(--container-gutter) * 2), var(--container-max));
  margin-inline: auto;
}

/* Sticky metrics bar just below the TopBar (56px) */
.metrics-sticky {
  position: sticky;
  top: 56px;
  z-index: 10;
  padding: 0.5rem 1rem;
  background: transparent;
  pointer-events: none; /* allow interactions with the grid beneath */
}

/* Removed ::before; gold stripe handled via background gradient above */

.confirm-text {
  margin: 0 0 12px;
}
</style>
