<script setup lang="ts">
import GameHeader from './GameHeader.vue'
import GameMetrics from './GameMetrics.vue'
import CalendarGrid from './CalendarGrid.vue'
import GameFooter from './GameFooter.vue'

// Derived header metrics (kept for header if needed)

// Whether the user can open a cell now (moved into GameMetrics, not needed here)
</script>

<template>
  <section class="game-section" aria-label="Spel">
    <GameHeader />
    <GameMetrics />
    <CalendarGrid />
    <GameFooter />
  </section>
  <!-- RevealModal and Tooltip are now managed internally by CalendarGrid -->
</template>

<style scoped>
.game-section {
  padding: 1rem;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  position: relative;
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
