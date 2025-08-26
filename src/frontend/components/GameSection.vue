<script setup lang="ts">
import { ref } from 'vue'
import Tooltip from './ui/Tooltip.vue'

// 100x100 grid (10,000 cells)
const rows = 100
const cols = 100
const cells = Array.from({ length: rows * cols }, (_, i) => i)

// Tooltip state
const tipOpen = ref(false)
const tipX = ref(0)
const tipY = ref(0)
const tipText = ref('')

const getRow = (i: number) => Math.floor(i / cols)
const getCol = (i: number) => i % cols

function onGridMove(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('button.cell') as HTMLElement | null
  if (!target) {
    tipOpen.value = false
    return
  }
  const idxAttr = target.getAttribute('data-index')
  if (idxAttr == null) {
    tipOpen.value = false
    return
  }
  const idx = Number(idxAttr)
  if (Number.isNaN(idx)) {
    tipOpen.value = false
    return
  }
  tipText.value = `Rij ${getRow(idx)}, Kolom ${getCol(idx)}`
  tipX.value = e.clientX
  tipY.value = e.clientY
  tipOpen.value = true
}

function onGridLeave() {
  tipOpen.value = false
}
</script>

<template>
  <section class="game-section">
    <h2>Verrassingskalender</h2>

    <div
      class="calendar-grid"
      role="grid"
      :aria-rowcount="rows"
      :aria-colcount="cols"
      @mousemove="onGridMove"
      @mouseleave="onGridLeave"
    >
      <button
        v-for="id in cells"
        :key="id"
        class="cell"
        role="gridcell"
        aria-label="Gesloten vakje"
        :data-index="id"
      />
    </div>
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

.calendar-grid {
  /* 100 columns grid */
  display: grid;
  grid-template-columns: repeat(100, 1fr);
  gap: 2px;
  width: 100%;
  user-select: none;
  box-sizing: border-box;
  max-width: 100vw; /* ensure grid stays within viewport */
}

.cell {
  /* Keep cells square regardless of width */
  aspect-ratio: 1 / 1;
  background: #f2f2f2;
  border: 0; /* avoid affecting track sizing */
  box-shadow: inset 0 0 0 1px #e0e0e0;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0; /* allow shrinking inside 1fr tracks */
  min-height: 0;
  box-sizing: border-box;
}

.cell:focus-visible {
  outline: 2px solid #2b6cb0;
  outline-offset: -2px;
}
</style>
