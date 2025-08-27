<script setup lang="ts">
import { ref } from 'vue'
import Tooltip from './ui/Tooltip.vue'
import GameHeader from './GameHeader.vue'
import GameMetrics from './GameMetrics.vue'
import CalendarGrid from './CalendarGrid.vue'
import GameFooter from './GameFooter.vue'
import RevealModal from './RevealModal.vue'
import { useGridStore } from '@/frontend/store/grid'
import { useTooltip } from '@/frontend/composables/useTooltip'

// Store (for header counts)
const grid = useGridStore()

// Derived header metrics (kept for header if needed)

// Tooltip via composable
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
  onLeave,
} = useTooltip()

// Modal state owned here, UI handled by RevealModal
const confirmOpen = ref(false)
const pending = ref<{ id: string; row: number; col: number } | null>(null)

function onRequestReveal(payload: { id: string; index: number; row: number; col: number }) {
  pending.value = { id: payload.id, row: payload.row, col: payload.col }
  confirmOpen.value = true
}

async function performReveal(id: string) {
  await grid.reveal(id)
  const entry = grid.revealed.find((c) => c.id === id)
  const t = entry?.prize?.type
  if (t === 'grand') return { type: 'grand' as const, amount: 25000 }
  if (t === 'consolation') return { type: 'consolation' as const, amount: 100 }
  return { type: 'none' as const, amount: 0 }
}

// no-op cancel handled inside RevealModal; keep state resets via onModalClosed

function onModalClosed() {
  pending.value = null
}

// Whether the user can open a cell now (moved into GameMetrics, not needed here)
</script>

<template>
  <section class="game-section" aria-label="Spel">
    <GameHeader />
    <GameMetrics />
    <CalendarGrid
      :confirmBeforeReveal="true"
      @request-reveal="onRequestReveal"
      @hover="onHover"
      @leave="onLeave"
    />
    <GameFooter />
  </section>

  <!-- Global tooltip following cursor -->
  <Tooltip :open="open" :x="x" :y="y" placement="top" :offset="12" :max-width="'340px'">
    <div class="tt-card">
      <div class="tt-row">
        <span class="tt-emoji" aria-hidden="true">📍</span>
        <span>{{ text }}</span>
      </div>
      <div class="tt-row">
        <span class="tt-emoji" aria-hidden="true">👤</span>
        <span>Geopend door: <strong>{{ opener ?? '—' }}</strong></span>
      </div>
      <div class="tt-row" :class="statusClass">
        <span class="tt-emoji" aria-hidden="true">🎯</span>
        <span>Status: <strong>{{ revealed ? 'Geopend' : 'Gesloten' }}</strong></span>
      </div>
      <div v-if="whenText" class="tt-row">
        <span class="tt-emoji" aria-hidden="true">⏰</span>
        <span>Geopend op: <strong>{{ whenText }}</strong></span>
      </div>
      <div class="tt-row" :class="prizeClass">
        <span class="tt-emoji" aria-hidden="true">🏆</span>
        <span>
          Prijs: <strong>{{ prizeEmoji }} {{ prizeLabel }}</strong>
          <template v-if="prizeAmountText">
            <span class="tt-amount">— {{ prizeAmountText }}</span>
          </template>
        </span>
      </div>
    </div>
  </Tooltip>

  <!-- Dedicated two-step RevealModal component -->
  <RevealModal
    v-model="confirmOpen"
    :pending="pending"
    :performReveal="performReveal"
    @closed="onModalClosed"
  />
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

/* Tooltip content styling */
.tt-card {
  display: grid;
  gap: 6px;
}
.tt-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tt-emoji {
  width: 1.2em;
  text-align: center;
}

/* Color coding */
.status--open {
  color: #9be09b;
}
.status--closed {
  color: #bbbbbb;
}

.prize--grand {
  color: #ffd700;
}
.prize--consolation {
  color: #9be09b;
}
.prize--none {
  color: #bfbfbf;
}

.tt-amount {
  color: #ffffff;
  font-weight: 600;
  margin-left: 4px;
}

.confirm-text {
  margin: 0 0 12px;
}
</style>
