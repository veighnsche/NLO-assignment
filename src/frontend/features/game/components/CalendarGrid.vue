<script setup lang="ts">
import { ref } from 'vue'
import RevealModal from './RevealModal.vue'
import type { GridTooltipApi } from './GridTooltip.vue'
import { useGridCells } from '@/frontend/features/game/composables/useGridCells'

// Encapsulated grid logic via composable
const {
  cells,
  grid,
  revealedById,
  getRow,
  getCol,
  cellIdFromIndex,
  isRevealed,
  isExposed,
  cellPrize,
  cellPrizeType,
  exposedPrizeType,
  isCellDisabled,
  ariaLabelForCell,
} = useGridCells(100, 100)

// Props (merged): confirmation flag and tooltip API provided by parent
const props = withDefaults(
  defineProps<{
    confirmBeforeReveal?: boolean
    tooltip?: GridTooltipApi | null
  }>(),
  {
    confirmBeforeReveal: true,
    tooltip: null,
  },
)

// Internal confirm + modal state
const confirmOpen = ref(false)
const pending = ref<{ id: string; row: number; col: number } | null>(null)

async function performReveal(id: string) {
  await grid.reveal(id)
  const entry = grid.revealed.find(
    (c: { id: string; prize?: { type?: 'none' | 'consolation' | 'grand'; amount?: number } }) =>
      c.id === id,
  )
  const t = entry?.prize?.type
  if (t === 'grand') return { type: 'grand' as const, amount: 25000 }
  if (t === 'consolation') return { type: 'consolation' as const, amount: 100 }
  return { type: 'none' as const, amount: 0 }
}

function onModalClosed() {
  pending.value = null
}

async function onReveal(i: number) {
  if (grid.isRevealing || isRevealed(i) || grid.userHasRevealed()) return
  if (props.confirmBeforeReveal) {
    pending.value = { id: cellIdFromIndex(i), row: getRow(i), col: getCol(i) }
    confirmOpen.value = true
    return
  }
  await grid.reveal(cellIdFromIndex(i))
}

// Tooltip control comes from parent via prop (available on props.tooltip)

// --- Performance: throttle mousemove updates to one per animation frame ---
const rafId = ref<number | null>(null)
const lastIdx = ref<number | null>(null)
function schedule(fn: () => void) {
  if (rafId.value != null) return
  rafId.value = requestAnimationFrame(() => {
    rafId.value = null
    fn()
  })
}

function onGridMove(e: MouseEvent) {
  schedule(() => {
    const target = (e.target as HTMLElement).closest('button.cell') as HTMLElement | null
    if (!target) {
      props.tooltip?.leave()
      lastIdx.value = null
      return
    }
    const idxAttr = target.getAttribute('data-index')
    if (idxAttr == null) {
      props.tooltip?.leave()
      lastIdx.value = null
      return
    }
    const idx = Number(idxAttr)
    if (Number.isNaN(idx)) {
      props.tooltip?.leave()
      lastIdx.value = null
      return
    }
    // If we're still on the same cell, only update position to reduce reactive work
    if (lastIdx.value === idx) {
      props.tooltip?.move(e.clientX, e.clientY)
      return
    }
    lastIdx.value = idx
    const text = `Rij ${getRow(idx)}, Kolom ${getCol(idx)}`
    const id = cellIdFromIndex(idx)
    const cell = revealedById.value.get(id)
    const openerName = grid.userNameById(cell?.revealedBy) || cell?.revealedBy || null
    props.tooltip?.hover({
      text,
      x: e.clientX,
      y: e.clientY,
      opener: openerName,
      revealed: !!cell?.revealed,
      prizeType: cell?.prize?.type,
      prizeAmount: cell?.prize?.amount,
      revealedAt: cell?.revealedAt ?? null,
    })
  })
}

function onGridLeave() {
  props.tooltip?.leave()
  lastIdx.value = null
}
</script>

<template>
  <div
    class="calendar-grid"
    aria-label="Speelraster"
    @mousemove="onGridMove"
    @mouseleave="onGridLeave"
  >
    <button
      v-for="id in cells"
      :key="id"
      class="cell"
      v-memo="[
        isRevealed(id),
        isCellDisabled(id),
        cellPrizeType(id),
        isExposed(id),
        exposedPrizeType(id),
      ]"
      :aria-label="ariaLabelForCell(id)"
      :class="{
        revealed: isRevealed(id),
        closed: !isRevealed(id),
        'closed-playable': !isRevealed(id) && !isCellDisabled(id),
        'closed-blocked': !isRevealed(id) && isCellDisabled(id),
        grand: cellPrizeType(id) === 'grand',
        consolation: cellPrizeType(id) === 'consolation',
        exposed: isExposed(id),
        'exposed-grand': exposedPrizeType(id) === 'grand',
        'exposed-consolation': exposedPrizeType(id) === 'consolation',
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
      <span v-else-if="isExposed(id)" class="expose" :data-type="exposedPrizeType(id)">
        {{ exposedPrizeType(id) === 'grand' ? '★' : '●' }}
      </span>
    </button>
  </div>
  <!-- Internal two-step RevealModal -->
  <RevealModal
    v-model="confirmOpen"
    :pending="pending"
    :performReveal="performReveal"
    @closed="onModalClosed"
  />
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
  /* Background image composed of two halves stacked vertically */
  background-image: url('/top-half.png'), url('/bottom-half.png');
  background-repeat: no-repeat, no-repeat;
  background-position: top, bottom;
  background-size:
    100% 50%,
    100% 50%;
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
  /* Reveal underlying grid background image */
  background: transparent;
  /* Remove per-cell border so adjacent revealed cells blend seamlessly */
  box-shadow: none;
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
/* Avoid outlines on revealed cells to prevent seams between adjacent revealed tiles */
.cell.revealed.consolation {
  box-shadow: none;
}

.cell.revealed.grand {
  box-shadow: none;
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

/* Admin-only exposure styles (closed cells only) */
.cell.closed.exposed {
  /* stronger outline + subtle glow */
  box-shadow:
    inset 0 0 0 2px color-mix(in srgb, var(--border-subtle) 40%, gold),
    0 0 6px rgba(255, 215, 0, 0.35);
}
.cell .expose {
  opacity: 0.95;
  font-size: 1.2rem;
  line-height: 1;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.25));
}
.cell .expose[data-type='grand'] {
  color: #b8860b; /* darkgoldenrod */
  text-shadow: 0 0 4px rgba(255, 223, 0, 0.7);
}
.cell .expose[data-type='consolation'] {
  color: #0b6db8; /* blue accent */
  text-shadow: 0 0 4px rgba(0, 123, 255, 0.5);
}

.cell:focus-visible {
  outline: 0;
  box-shadow:
    inset 0 0 0 2px var(--color-accent-gold),
    inset 0 0 0 4px color-mix(in srgb, var(--color-primary-green) 30%, transparent);
}
</style>
