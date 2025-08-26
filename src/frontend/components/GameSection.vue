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
}
</style>
