<script setup lang="ts">
import { ref } from 'vue'
import Tooltip from './ui/Tooltip.vue'
import GameHeader from './GameHeader.vue'
import CalendarGrid from './CalendarGrid.vue'
import { useGridStore } from '@/frontend/store/grid'

// Store (for header counts)
const grid = useGridStore()

// Tooltip state managed by parent; grid emits hover/leave
const tipOpen = ref(false)
const tipX = ref(0)
const tipY = ref(0)
const tipText = ref('')

function onHover(payload: { text: string; x: number; y: number }) {
  tipText.value = payload.text
  tipX.value = payload.x
  tipY.value = payload.y
  tipOpen.value = true
}

function onLeave() {
  tipOpen.value = false
}
</script>

<template>
  <section class="game-section">
    <GameHeader :opened-count="grid.openedCount" :total="grid.total" />
    <CalendarGrid @hover="onHover" @leave="onLeave" />
  </section>

  <!-- Global tooltip following cursor -->
  <Tooltip :open="tipOpen" :x="tipX" :y="tipY" placement="top" :offset="12">
    {{ tipText }}
  </Tooltip>
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
</style>
