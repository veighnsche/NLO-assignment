<script setup lang="ts">
import { ref, computed } from 'vue'
import Tooltip from '@/frontend/ui/Tooltip.vue'

// Types (previously from composable)
type PrizeType = 'none' | 'consolation' | 'grand' | undefined
type PrizeAmount = 0 | 100 | 25000 | undefined

export interface TooltipPayload {
  text: string
  x: number
  y: number
  opener: string | null
  revealed: boolean
  prizeType?: 'none' | 'consolation' | 'grand'
  prizeAmount?: 0 | 100 | 25000
  revealedAt?: string | null
}

// Hoisted formatters
const nfCurrency = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const dfDateTime = new Intl.DateTimeFormat('nl-NL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

// Core state
const open = ref(false)
const x = ref(0)
const y = ref(0)
const text = ref('')
const opener = ref<string | null>(null)
const revealed = ref(false)
const prizeType = ref<PrizeType>(undefined)
const prizeAmount = ref<PrizeAmount>(undefined)
const revealedAt = ref<string | null>(null)

// Derived values
const prizeLabel = computed(() => {
  if (prizeType.value === 'grand') return 'Hoofdprijs'
  if (prizeType.value === 'consolation') return 'Troostprijs'
  if (prizeType.value === 'none') return 'Geen prijs'
  return 'Onbekend'
})

const prizeEmoji = computed(() => {
  if (prizeType.value === 'grand') return '💎'
  if (prizeType.value === 'consolation') return '🎁'
  return '—'
})

const prizeAmountText = computed(() =>
  prizeAmount.value != null ? nfCurrency.format(prizeAmount.value) : '',
)

const prizeClass = computed(() => {
  return prizeType.value === 'grand'
    ? 'prize--grand'
    : prizeType.value === 'consolation'
      ? 'prize--consolation'
      : 'prize--none'
})

const statusClass = computed(() => (revealed.value ? 'status--open' : 'status--closed'))

const whenText = computed(() =>
  revealedAt.value ? dfDateTime.format(new Date(revealedAt.value)) : null,
)

// Handlers
function onHover(payload: TooltipPayload) {
  text.value = payload.text
  x.value = payload.x
  y.value = payload.y
  opener.value = payload.opener ?? null
  revealed.value = payload.revealed
  prizeType.value = payload.prizeType
  prizeAmount.value = payload.prizeAmount
  revealedAt.value = payload.revealedAt ?? null
  open.value = true
}

function onLeave() {
  open.value = false
}

function onMove(nx: number, ny: number) {
  if (!open.value) return
  x.value = nx
  y.value = ny
}

// Expose imperative API so parent can drive tooltip without prop updates
export interface GridTooltipApi {
  hover(payload: TooltipPayload): void
  move(x: number, y: number): void
  leave(): void
}

function hover(payload: TooltipPayload) {
  onHover(payload)
}
function move(nx: number, ny: number) {
  onMove(nx, ny)
}
function leave() {
  onLeave()
}

defineExpose<GridTooltipApi>({ hover, move, leave })
</script>

<template>
  <Tooltip :open="open" :x="x" :y="y" placement="top" :offset="12" :max-width="'340px'">
    <div class="tt-card">
      <div class="tt-row">
        <span class="tt-emoji" aria-hidden="true">📍</span>
        <span>{{ text }}</span>
      </div>
      <div class="tt-row">
        <span class="tt-emoji" aria-hidden="true">👤</span>
        <span
          >Geopend door: <strong>{{ opener ?? '—' }}</strong></span
        >
      </div>
      <div class="tt-row" :class="statusClass">
        <span class="tt-emoji" aria-hidden="true">🎯</span>
        <span
          >Status: <strong>{{ revealed ? 'Geopend' : 'Gesloten' }}</strong></span
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
</template>

<style scoped>
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
</style>
