<script setup lang="ts">
import Tooltip from '@/frontend/shared/ui/Tooltip.vue'

const props = defineProps<{
  open: boolean
  x: number
  y: number
  text: string
  opener: string | null
  revealed: boolean
  whenText?: string | null
  prizeLabel: string
  prizeEmoji: string
  prizeAmountText?: string | null
  prizeClass: string
  statusClass: string
}>()
</script>

<template>
  <Tooltip
    :open="props.open"
    :x="props.x"
    :y="props.y"
    placement="top"
    :offset="12"
    :max-width="'340px'"
  >
    <div class="tt-card">
      <div class="tt-row">
        <span class="tt-emoji" aria-hidden="true">📍</span>
        <span>{{ props.text }}</span>
      </div>
      <div class="tt-row">
        <span class="tt-emoji" aria-hidden="true">👤</span>
        <span
          >Geopend door: <strong>{{ props.opener ?? '—' }}</strong></span
        >
      </div>
      <div class="tt-row" :class="props.statusClass">
        <span class="tt-emoji" aria-hidden="true">🎯</span>
        <span
          >Status: <strong>{{ props.revealed ? 'Geopend' : 'Gesloten' }}</strong></span
        >
      </div>
      <div v-if="props.whenText" class="tt-row">
        <span class="tt-emoji" aria-hidden="true">⏰</span>
        <span
          >Geopend op: <strong>{{ props.whenText }}</strong></span
        >
      </div>
      <div class="tt-row" :class="props.prizeClass">
        <span class="tt-emoji" aria-hidden="true">🏆</span>
        <span>
          Prijs: <strong>{{ props.prizeEmoji }} {{ props.prizeLabel }}</strong>
          <template v-if="props.prizeAmountText">
            <span class="tt-amount">— {{ props.prizeAmountText }}</span>
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
