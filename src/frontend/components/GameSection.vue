<script setup lang="ts">
import { ref, computed } from 'vue'
import Tooltip from './ui/Tooltip.vue'
import GameHeader from './GameHeader.vue'
import CalendarGrid from './CalendarGrid.vue'
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

function onHover(payload: {
  text: string
  x: number
  y: number
  opener: string | null
  revealed: boolean
  prizeType?: 'none' | 'consolation' | 'grand'
  prizeAmount?: 0 | 100 | 25000
}) {
  tipText.value = payload.text
  tipX.value = payload.x
  tipY.value = payload.y
  tipOpener.value = payload.opener ?? null
  tipRevealed.value = payload.revealed
  tipPrizeType.value = payload.prizeType
  tipPrizeAmount.value = payload.prizeAmount
  tipOpen.value = true
}

function onLeave() {
  tipOpen.value = false
}
</script>

<template>
  <section class="game-section">
    <GameHeader
      :opened-count="grid.openedCount"
      :total="grid.total"
      :consolation-opened-count="consolationOpenedCount"
      :grand-opened="grandOpened"
      :consolation-total="grid.consolationTotal"
    />
    <CalendarGrid @hover="onHover" @leave="onLeave" />
  </section>

  <!-- Global tooltip following cursor -->
  <Tooltip :open="tipOpen" :x="tipX" :y="tipY" placement="top" :offset="12" :max-width="'320px'">
    <div class="tt-card">
      <div class="tt-row">
        <span class="tt-emoji">📍</span>
        <span>{{ tipText }}</span>
      </div>
      <div class="tt-row">
        <span class="tt-emoji">👤</span>
        <span>Geopend door: <strong>{{ tipOpener ?? '—' }}</strong></span>
      </div>
      <div class="tt-row">
        <span class="tt-emoji">🎯</span>
        <span>Status: <strong>{{ tipRevealed ? 'Geopend' : 'Gesloten' }}</strong></span>
      </div>
      <div class="tt-row">
        <span class="tt-emoji">🏆</span>
        <span>
          Prijs:
          <strong v-if="tipPrizeType === 'grand'">💎 Hoofdprijs {{ tipPrizeAmount ?? '' }}</strong>
          <strong v-else-if="tipPrizeType === 'consolation'">🎁 Troostprijs {{ tipPrizeAmount ?? '' }}</strong>
          <strong v-else-if="tipPrizeType === 'none'">—</strong>
          <strong v-else>—</strong>
        </span>
      </div>
    </div>
  </Tooltip>
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
.tt-emoji { width: 1.2em; text-align: center; }
</style>
