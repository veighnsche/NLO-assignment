<script setup lang="ts">
import { ref, computed } from 'vue'
import Tooltip from './ui/Tooltip.vue'
import GameHeader from './GameHeader.vue'
import CalendarGrid from './CalendarGrid.vue'
import GameFooter from './GameFooter.vue'
import RevealModal from './RevealModal.vue'
import { useGridStore } from '@/frontend/store/grid'

// Store (for header counts)
const grid = useGridStore()

// Derived header metrics
const consolationOpenedCount = computed(
  () => grid.revealed.filter((c) => c.prize?.type === 'consolation').length,
)
const grandOpened = computed(() => grid.revealed.some((c) => c.prize?.type === 'grand'))

// Tooltip state managed by parent; grid emits hover/leave
const tipOpen = ref(false)
const tipX = ref(0)
const tipY = ref(0)
const tipText = ref('')
const tipOpener = ref<string | null>(null)
const tipRevealed = ref(false)
const tipPrizeType = ref<'none' | 'consolation' | 'grand' | undefined>(undefined)
const tipPrizeAmount = ref<0 | 100 | 25000 | undefined>(undefined)
const tipRevealedAt = ref<string | null>(null)

// Localization helpers
const nfCurrency = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const dfDateTime = new Intl.DateTimeFormat('nl-NL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const prizeLabel = computed(() => {
  if (tipPrizeType.value === 'grand') return 'Hoofdprijs'
  if (tipPrizeType.value === 'consolation') return 'Troostprijs'
  if (tipPrizeType.value === 'none') return 'Geen prijs'
  return 'Onbekend'
})

const prizeEmoji = computed(() => {
  if (tipPrizeType.value === 'grand') return '💎'
  if (tipPrizeType.value === 'consolation') return '🎁'
  return '—'
})

const prizeAmountText = computed(() =>
  tipPrizeAmount.value != null ? nfCurrency.format(tipPrizeAmount.value) : '',
)

const prizeClass = computed(() => {
  return tipPrizeType.value === 'grand'
    ? 'prize--grand'
    : tipPrizeType.value === 'consolation'
      ? 'prize--consolation'
      : 'prize--none'
})

const statusClass = computed(() => (tipRevealed.value ? 'status--open' : 'status--closed'))
const whenText = computed(() =>
  tipRevealedAt.value ? dfDateTime.format(new Date(tipRevealedAt.value)) : null,
)

function onHover(payload: {
  text: string
  x: number
  y: number
  opener: string | null
  revealed: boolean
  prizeType?: 'none' | 'consolation' | 'grand'
  prizeAmount?: 0 | 100 | 25000
  revealedAt?: string | null
}) {
  tipText.value = payload.text
  tipX.value = payload.x
  tipY.value = payload.y
  tipOpener.value = payload.opener ?? null
  tipRevealed.value = payload.revealed
  tipPrizeType.value = payload.prizeType
  tipPrizeAmount.value = payload.prizeAmount
  tipRevealedAt.value = payload.revealedAt ?? null
  tipOpen.value = true
}

function onLeave() {
  tipOpen.value = false
}

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

// Whether the user can open a cell now
const canOpen = computed(
  () => !grid.isRevealing && !grid.userHasRevealed() && grid.openedCount < grid.total,
)
</script>

<template>
  <section class="game-section" aria-label="Spel">
    <GameHeader
      :opened-count="grid.openedCount"
      :total="grid.total"
      :consolation-opened-count="consolationOpenedCount"
      :grand-opened="grandOpened"
      :consolation-total="grid.consolationTotal"
      :can-open="canOpen"
    />
    <CalendarGrid
      :confirmBeforeReveal="true"
      @request-reveal="onRequestReveal"
      @hover="onHover"
      @leave="onLeave"
    />
    <GameFooter />
  </section>

  <!-- Global tooltip following cursor -->
  <Tooltip :open="tipOpen" :x="tipX" :y="tipY" placement="top" :offset="12" :max-width="'340px'">
    <div class="tt-card">
      <div class="tt-row">
        <span class="tt-emoji" aria-hidden="true">📍</span>
        <span>{{ tipText }}</span>
      </div>
      <div class="tt-row">
        <span class="tt-emoji" aria-hidden="true">👤</span>
        <span
          >Geopend door: <strong>{{ tipOpener ?? '—' }}</strong></span
        >
      </div>
      <div class="tt-row" :class="statusClass">
        <span class="tt-emoji" aria-hidden="true">🎯</span>
        <span
          >Status: <strong>{{ tipRevealed ? 'Geopend' : 'Gesloten' }}</strong></span
        >
      </div>
      <div v-if="whenText" class="tt-row">
        <span class="tt-emoji" aria-hidden="true">⏰</span>
        <span
          >Geopend op: <strong>{{ whenText }}</strong></span
        >
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
