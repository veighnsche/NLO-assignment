<script setup lang="ts">
import { ref, computed } from 'vue'
import Tooltip from './ui/Tooltip.vue'
import { useGridStore } from '@/frontend/store/grid'

// 100x100 grid (10,000 cells)
const rows = 100
const cols = 100
const cells = Array.from({ length: rows * cols }, (_, i) => i)

// Store
const grid = useGridStore()
const revealedSet = computed(() => grid.revealedSet)
const revealedMap = computed(() => {
  const m = new Map<string, (typeof grid.revealed)[number]>()
  for (const c of grid.revealed) m.set(c.id, c)
  return m
})

function isRevealed(i: number): boolean {
  return revealedSet.value.has(String(i))
}

function cellPrize(i: number) {
  return revealedMap.value.get(String(i))?.prize
}

async function onReveal(i: number) {
  if (grid.isRevealing || isRevealed(i) || grid.userHasRevealed()) return
  await grid.reveal(String(i))
}

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
    <p class="counts">Geopend: {{ grid.openedCount }} / {{ grid.total }}</p>

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
        :aria-label="isRevealed(id) ? 'Geopend vakje' : 'Gesloten vakje'"
        :class="{ revealed: isRevealed(id) }"
        :disabled="grid.isRevealing || grid.userHasRevealed() || isRevealed(id)"
        :data-index="id"
        @click="onReveal(id)"
      >
        <span v-if="isRevealed(id)" class="reveal">
          {{ cellPrize(id)?.type === 'grand' ? '💎' : cellPrize(id)?.type === 'consolation' ? '🎁' : '•' }}
        </span>
      </button>
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

.counts {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.95rem;
}

.calendar-grid {
  /* 100 columns grid */
  display: grid;
  grid-template-columns: repeat(100, 1fr);
  gap: 0;
  width: 100%;
  user-select: none;
  box-sizing: border-box;
  max-width: 100vw; /* ensure grid stays within viewport */
  border: 1px solid #e0e0e0;
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

.cell.revealed {
  background: #fff;
  box-shadow: inset 0 0 0 1px #d6d6d6;
}

.cell .reveal {
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 300ms ease, transform 300ms ease;
}

.cell.revealed .reveal {
  opacity: 1;
  transform: scale(1);
}

.cell:focus-visible {
  outline: 2px solid #2b6cb0;
  outline-offset: -2px;
}
</style>
