<script setup lang="ts">
import Tooltip from '@/frontend/ui/Tooltip.vue'
import { Icon } from '@iconify/vue'
import { useGridTooltip } from '@/frontend/features/game/composables/useGridTooltip'

const {
  // state
  open,
  x,
  y,
  text,
  opener,
  revealed,
  // derived
  prizeLabel,
  prizeAmountText,
  prizeClass,
  statusClass,
  whenText,
  // handlers
  onHover,
  onMove,
  onLeave,
} = useGridTooltip()

// Expose imperative API so parent can drive tooltip without prop updates
function hover(payload: Parameters<typeof onHover>[0]) {
  onHover(payload)
}
function move(nx: number, ny: number) {
  onMove(nx, ny)
}
function leave() {
  onLeave()
}

defineExpose({ hover, move, leave })
</script>

<template>
  <Tooltip :open="open" :x="x" :y="y" placement="top" :offset="12" :max-width="'340px'">
    <div class="tt-card">
      <div class="tt-row">
        <Icon class="tt-emoji" icon="mdi:map-marker" aria-hidden="true" />
        <span>{{ text }}</span>
      </div>
      <div class="tt-row">
        <Icon class="tt-emoji" icon="mdi:account" aria-hidden="true" />
        <span
          >Geopend door: <strong>{{ opener ?? '—' }}</strong></span
        >
      </div>
      <div class="tt-row" :class="statusClass">
        <Icon class="tt-emoji" icon="mdi:target" aria-hidden="true" />
        <span
          >Status: <strong>{{ revealed ? 'Geopend' : 'Gesloten' }}</strong></span
        >
      </div>
      <div v-if="whenText" class="tt-row">
        <Icon class="tt-emoji" icon="mdi:clock-time-four-outline" aria-hidden="true" />
        <span
          >Geopend op: <strong>{{ whenText }}</strong></span
        >
      </div>
      <div class="tt-row" :class="prizeClass">
        <Icon class="tt-emoji" icon="mdi:trophy" aria-hidden="true" />
        <span>
          Prijs: <Icon class="tt-emoji" icon="mdi:gift" v-if="prizeLabel === 'Troostprijs'" aria-hidden="true" />
          <Icon class="tt-emoji" icon="mdi:diamond-stone" v-else-if="prizeLabel === 'Hoofdprijs'" aria-hidden="true" />
          <strong>{{ prizeLabel }}</strong>
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
