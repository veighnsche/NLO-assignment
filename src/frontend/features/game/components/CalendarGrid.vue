<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGridStore } from '@/frontend/features/game/store/grid'
import RevealModal from './RevealModal.vue'
import GridTooltip from './GridTooltip.vue'
import { useTooltip } from '@/frontend/shared/composables/useTooltip'

// 100x100 grid (10,000 cells)
const rows = 100
const cols = 100
const cells = Array.from({ length: rows * cols }, (_, i) => i)

// Store
const grid = useGridStore()
const revealedSet = computed(() => grid.revealedSet)
const exposedSet = computed(() => grid.exposedSet)
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

function isExposed(i: number): boolean {
  // Only consider exposed when admin toggle is active and the cell is not revealed
  return grid.showExposed && !isRevealed(i) && exposedSet.value.has(cellIdFromIndex(i))
}

function cellPrize(i: number) {
  return revealedMap.value.get(cellIdFromIndex(i))?.prize
}

// Prize type helper: 'grand' | 'consolation' | undefined
function cellPrizeType(i: number): 'grand' | 'consolation' | undefined {
  return cellPrize(i)?.type as 'grand' | 'consolation' | undefined
}

function exposedPrizeType(i: number): 'grand' | 'consolation' | undefined {
  if (!isExposed(i)) return undefined
  const id = cellIdFromIndex(i)
  const t = grid.exposedTargets.find(
    (x: { id: string; prize?: { type?: 'grand' | 'consolation' } }) => x.id === id,
  )?.prize?.type
  return t === 'grand' || t === 'consolation' ? t : undefined
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

const props = withDefaults(defineProps<{ confirmBeforeReveal?: boolean }>(), {
  confirmBeforeReveal: true,
})

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

const getRow = (i: number) => Math.floor(i / cols)
const getCol = (i: number) => i % cols

// Tooltip composable
const {
  open,
  x,
  y,
  text,
  opener,
  revealed,
  prizeLabel,
  prizeEmoji,
  prizeAmountText,
  prizeClass,
  statusClass,
  whenText,
  onHover,
  onMove,
  onLeave,
} = useTooltip()

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
      onLeave()
      lastIdx.value = null
      return
    }
    const idxAttr = target.getAttribute('data-index')
    if (idxAttr == null) {
      onLeave()
      lastIdx.value = null
      return
    }
    const idx = Number(idxAttr)
    if (Number.isNaN(idx)) {
      onLeave()
      lastIdx.value = null
      return
    }
    // If we're still on the same cell, only update position to reduce reactive work
    if (lastIdx.value === idx) {
      onMove(e.clientX, e.clientY)
      return
    }
    lastIdx.value = idx
    const text = `Rij ${getRow(idx)}, Kolom ${getCol(idx)}`
    const id = cellIdFromIndex(idx)
    const cell = revealedMap.value.get(id)
    onHover({
      text,
      x: e.clientX,
      y: e.clientY,
      opener: cell?.revealedBy ?? null,
      revealed: !!cell?.revealed,
      prizeType: cell?.prize?.type,
      prizeAmount: cell?.prize?.amount,
      revealedAt: cell?.revealedAt ?? null,
    })
  })
}

function onGridLeave() {
  onLeave()
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
  <!-- Tooltip rendered via dedicated component -->
  <GridTooltip
    :open="open"
    :x="x"
    :y="y"
    :text="text"
    :opener="opener"
    :revealed="revealed"
    :when-text="whenText"
    :prize-label="prizeLabel"
    :prize-emoji="prizeEmoji"
    :prize-amount-text="prizeAmountText"
    :prize-class="prizeClass"
    :status-class="statusClass"
  />
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
