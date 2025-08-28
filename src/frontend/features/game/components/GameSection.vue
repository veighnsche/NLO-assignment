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
    <GameMetrics />
    <CalendarGrid :tooltip="tooltipRef" />
  </section>
  <!-- Tooltip instance is hoisted here to avoid any coupling to the 10k grid subtree -->
  <GridTooltip ref="tooltipRef" />
</template>

<style scoped>
.game-section {
  padding: 1rem;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  position: relative;
  /* Constrain width and keep gutters from screen edges */
  width: min(100% - calc(var(--container-gutter) * 2), var(--container-max));
  margin-inline: auto;
}

/* Decorative gold accent at the top to echo festive vibe */
.game-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-accent-gold);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
}

.confirm-text {
  margin: 0 0 12px;
}
</style>
