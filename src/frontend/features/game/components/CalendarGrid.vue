<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { GridTooltipApi } from '@/frontend/features/game/composables/useGridTooltip'
import { useGridCells } from '@/frontend/features/game/composables/useGridCells'
import type { RevealResult } from '@/frontend/types/api'
import { useGridHoverTooltip } from '@/frontend/features/game/composables/useGridHoverTooltip'
import { useStatusStore } from '@/frontend/features/game/store/status'
import { useSessionStore } from '@/frontend/features/game/store/session'

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

const status = useStatusStore()
const session = useSessionStore()

// Props (merged): confirmation flag and tooltip API provided by parent
const props = withDefaults(
  defineProps<{
    confirmBeforeReveal?: boolean
    // Can be the actual API or a Ref to it (as passed from parent via template ref)
    tooltip?: GridTooltipApi | null | { value: GridTooltipApi | null }
  }>(),
  {
    confirmBeforeReveal: true,
    tooltip: null,
  },
)

// Emit to let parent optionally own confirmation modal
const emit = defineEmits<{
  (e: 'request-reveal', payload: { id: string; row: number; col: number }): void
}>()

async function performReveal(id: string): Promise<RevealResult> {
  await grid.reveal(id)
  const entry = grid.revealed.find((c) => c.id === id)
  const t = entry?.prize?.type
  if (t === 'grand') return { type: 'grand' as const, amount: 25000 }
  if (t === 'consolation') return { type: 'consolation' as const, amount: 100 }
  return { type: 'none' as const, amount: 0 }
}

async function onReveal(i: number) {
  if (status.isRevealing || isRevealed(i) || grid.userHasRevealed()) return
  if (props.confirmBeforeReveal) {
    emit('request-reveal', { id: cellIdFromIndex(i), row: getRow(i), col: getCol(i) })
    return
  }
  await grid.reveal(cellIdFromIndex(i))
}

// Resolve tooltip whether passed as instance or ref
function resolveTooltip(): GridTooltipApi | null {
  const anyT = props.tooltip as unknown as
    | GridTooltipApi
    | null
    | { value: GridTooltipApi | null }
    | undefined
  if (anyT && typeof anyT === 'object' && 'value' in anyT) return anyT.value ?? null
  return (anyT as GridTooltipApi | null | undefined) ?? null
}

// Tooltip control comes from parent via getter to avoid capturing null before mount
const { onGridMove, onGridLeave } = useGridHoverTooltip({
  getTooltip: () => resolveTooltip(),
  getRow,
  getCol,
  cellIdFromIndex,
  revealedById,
  userNameById: session.userNameById,
})

// Expose reveal method so parent can call via template ref from its modal
defineExpose({ performReveal })
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
      type="button"
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
        <Icon v-if="cellPrize(id)?.type === 'grand'" icon="mdi:diamond-stone" aria-hidden="true" />
        <Icon
          v-else-if="cellPrize(id)?.type === 'consolation'"
          icon="mdi:gift"
          aria-hidden="true"
        />
        <Icon v-else icon="mdi:circle-small" aria-hidden="true" />
      </span>
      <span v-else-if="isExposed(id)" class="expose" :data-type="exposedPrizeType(id)">
        <Icon v-if="exposedPrizeType(id) === 'grand'" icon="mdi:star" aria-hidden="true" />
        <Icon v-else icon="mdi:checkbox-blank-circle" aria-hidden="true" />
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
  /* Constrain width to create side space so page background is visible */
  max-width: min(1200px, 100vw - 2rem);
  margin-inline: auto; /* center the grid within the page */
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
  overflow: hidden; /* ensure inner highlights/icons never bleed outside the tile */
}

.cell.revealed {
  /* Reveal underlying grid background image */
  background: transparent;
  /* Remove per-cell border so adjacent revealed cells blend seamlessly */
  box-shadow: none;
}

/* Closed + playable vs blocked distinction */
.cell.closed.closed-playable {
  cursor: pointer;
}
.cell.closed.closed-playable:hover {
  background: color-mix(in srgb, var(--surface-alt) 80%, white);
}

.cell:disabled {
  cursor: not-allowed;
  background: color-mix(in srgb, var(--surface-alt) 85%, white);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--border-subtle) 75%, white);
  filter: grayscale(0.2);
}

/* Ensure disabled styles do not override revealed transparency */
.cell.revealed:disabled {
  background: transparent;
  box-shadow: none;
  filter: none;
}

/* Revealed + prize variants */
/* Avoid outlines on revealed cells to prevent seams between adjacent revealed tiles */
.cell.revealed {
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
  font-size: 1rem;
}

/* Ensure inner content is centered regardless of icon intrinsic metrics */
.cell > .reveal,
.cell > .expose {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Admin-only exposure styles (closed cells only) */
.cell.closed.exposed {
  /* stronger outline + subtle glow */
  box-shadow:
    inset 0 0 0 2px color-mix(in srgb, var(--border-subtle) 40%, gold),
    0 0 6px rgba(255, 215, 0, 0.35);
}
/* Emphasize revealed prize icons without obscuring background image */
.cell.revealed .reveal {
  color: rgba(255, 255, 255, 0.65);
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.35);
}
.cell.revealed.grand .reveal,
.cell.revealed.consolation .reveal {
  /* Slight size bump and a gentle, one-time pulse */
  transform: scale(1);
  animation: cell-pulse 900ms ease-out 1;
}

@keyframes cell-pulse {
  0% {
    transform: scale(0.9);
    filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
  }
  40% {
    transform: scale(1.02);
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.65));
  }
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
  }
}
.cell .expose {
  opacity: 0.95;
  font-size: 1.2rem;
  line-height: 1;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.25));
}
.cell .expose :deep(svg) {
  /* Keep the exposed icon within the bounds of the cell on very small tiles */
  width: 60%;
  height: 60%;
  display: block;
  margin: auto;
}
.cell .reveal :deep(svg) {
  /* Keep revealed prize icons reasonably small as well */
  width: 50%;
  height: 50%;
  display: block;
  margin: auto;
}
.cell .expose[data-type='grand'] {
  color: var(--color-accent-gold);
  text-shadow: 0 0 4px rgba(255, 223, 0, 0.7);
}
.cell .expose[data-type='consolation'] {
  color: var(--state-info);
  text-shadow: 0 0 4px rgba(0, 123, 255, 0.5);
}

.cell:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
