<script setup lang="ts">
import { computed } from 'vue'
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

// Backend cell ids are like: r{row}-c{col}
function cellIdFromIndex(i: number): string {
  return `r${getRow(i)}-c${getCol(i)}`
}

function isRevealed(i: number): boolean {
  return revealedSet.value.has(cellIdFromIndex(i))
}

function cellPrize(i: number) {
  return revealedMap.value.get(cellIdFromIndex(i))?.prize
}

// Prize type helper: 'grand' | 'consolation' | undefined
function cellPrizeType(i: number): 'grand' | 'consolation' | undefined {
  return cellPrize(i)?.type as 'grand' | 'consolation' | undefined
}

// Accessible label helper
function ariaLabelForCell(i: number): string {
  if (!isRevealed(i)) {
    return isCellDisabled(i) ? 'Gesloten vakje (niet speelbaar)' : 'Gesloten vakje (speelbaar)'
  }
  const t = cellPrizeType(i)
  if (t === 'grand') return 'Geopend vakje (Hoofdprijs)'
  if (t === 'consolation') return 'Geopend vakje (Troostprijs)'
  return 'Geopend vakje'
}

// Disabled helper: mirrors :disabled binding in template
function isCellDisabled(i: number): boolean {
  return grid.isRevealing || grid.userHasRevealed() || isRevealed(i)
}

async function onReveal(i: number) {
  if (grid.isRevealing || isRevealed(i) || grid.userHasRevealed()) return
  await grid.reveal(cellIdFromIndex(i))
}

const getRow = (i: number) => Math.floor(i / cols)
const getCol = (i: number) => i % cols

const emit = defineEmits<{
  (e: 'hover', payload: {
    text: string
    x: number
    y: number
    opener: string | null
    revealed: boolean
    prizeType?: 'none' | 'consolation' | 'grand'
    prizeAmount?: 0 | 100 | 25000
  }): void
  (e: 'leave'): void
}>()

function onGridMove(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('button.cell') as HTMLElement | null
  if (!target) {
    emit('leave')
    return
  }
  const idxAttr = target.getAttribute('data-index')
  if (idxAttr == null) {
    emit('leave')
    return
  }
  const idx = Number(idxAttr)
  if (Number.isNaN(idx)) {
    emit('leave')
    return
  }
  const text = `Rij ${getRow(idx)}, Kolom ${getCol(idx)}`
  const id = cellIdFromIndex(idx)
  const cell = revealedMap.value.get(id)
  emit('hover', {
    text,
    x: e.clientX,
    y: e.clientY,
    opener: cell?.revealedBy ?? null,
    revealed: !!cell?.revealed,
    prizeType: cell?.prize?.type,
    prizeAmount: cell?.prize?.amount,
  })
}

function onGridLeave() {
  emit('leave')
}
</script>

<template>
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
      :aria-label="ariaLabelForCell(id)"
      :class="{
        revealed: isRevealed(id),
        closed: !isRevealed(id),
        'closed-playable': !isRevealed(id) && !isCellDisabled(id),
        'closed-blocked': !isRevealed(id) && isCellDisabled(id),
        grand: cellPrizeType(id) === 'grand',
        consolation: cellPrizeType(id) === 'consolation',
      }"
      :disabled="isCellDisabled(id)"
      :data-index="id"
      @click="onReveal(id)"
    >
      <span v-if="isRevealed(id)" class="reveal">
        {{
          cellPrize(id)?.type === 'grand'
            ? '💎'
            : cellPrize(id)?.type === 'consolation'
              ? '🎁'
              : '•'
        }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.calendar-grid {
  /* 100 columns grid */
  display: grid;
  grid-template-columns: repeat(100, 1fr);
  gap: 0;
  width: 100%;
  user-select: none;
  box-sizing: border-box;
  max-width: 100vw; /* ensure grid stays within viewport */
  border: 1px solid var(--border-subtle);
}

.cell {
  /* Keep cells square regardless of width */
  aspect-ratio: 1 / 1;
  background: var(--surface-alt);
  border: 0; /* avoid affecting track sizing */
  box-shadow: inset 0 0 0 1px var(--border-subtle);
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
  /* Stronger contrast for opened cells */
  background: color-mix(in srgb, var(--surface-elevated) 75%, var(--color-accent-gold));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 65%, black);
}

/* Closed (not yet opened) */
.cell.closed {
  background: var(--surface-alt);
}

/* Closed + playable vs blocked distinction */
.cell.closed.closed-playable {
  cursor: pointer;
}
.cell.closed.closed-playable:hover {
  background: color-mix(in srgb, var(--surface-alt) 80%, white);
}

.cell.closed.closed-blocked,
.cell:disabled.closed {
  cursor: not-allowed;
  background: color-mix(in srgb, var(--surface-alt) 85%, white);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--border-subtle) 75%, white);
  filter: grayscale(0.2);
}

/* Revealed + prize variants */
.cell.revealed.consolation {
  background: color-mix(in srgb, var(--color-primary-green) 22%, white);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-green) 65%, white);
}

.cell.revealed.grand {
  background: color-mix(in srgb, var(--color-accent-gold) 38%, white);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 65%, black);
}

.cell .reveal {
  opacity: 0;
  transform: scale(0.8);
  transition:
    opacity 300ms ease,
    transform 300ms ease;
}

.cell.revealed .reveal {
  opacity: 1;
  transform: scale(1);
}

/* Optional: tweak emoji sizing */
.cell .reveal {
  font-size: 0.9rem;
}

.cell:focus-visible {
  outline: 0;
  box-shadow:
    inset 0 0 0 2px var(--color-accent-gold),
    inset 0 0 0 4px color-mix(in srgb, var(--color-primary-green) 30%, transparent);
}
</style>
