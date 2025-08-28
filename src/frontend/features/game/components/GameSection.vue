<script setup lang="ts">
import { ref } from 'vue'
import GameMetrics from './GameMetrics.vue'
import CalendarGrid from './CalendarGrid.vue'
import GridTooltip from './GridTooltip.vue'
import type { GridTooltipApi } from '@/frontend/features/game/composables/useGridTooltip'

// Tooltip instance owned here and passed down to grid as an imperative API
const tooltipRef = ref<GridTooltipApi | null>(null)

// Derived header metrics (kept for header if needed)

// Whether the user can open a cell now (moved into GameMetrics, not needed here)
</script>

<template>
  <section class="game-section" aria-label="Spel">
    <div class="metrics-sticky" aria-hidden="false">
      <GameMetrics />
    </div>
    <CalendarGrid :tooltip="tooltipRef" />
  </section>
  <!-- Tooltip instance is hoisted here to avoid any coupling to the 10k grid subtree -->
  <GridTooltip ref="tooltipRef" />
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
