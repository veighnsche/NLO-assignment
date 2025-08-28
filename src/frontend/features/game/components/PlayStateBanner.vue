<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useGridStore } from '@/frontend/features/game/store/grid'
import { useSessionStore } from '@/frontend/features/game/store/session'

const grid = useGridStore()
const session = useSessionStore()

const activePid = computed(() => session.activePlayerId)

const myReveal = computed(() => {
  const pid = activePid.value
  if (!pid) return null
  // find the cell revealed by me (there should be at most one)
  return grid.revealed.find((c) => c.revealedBy === pid) ?? null
})

const canOpen = computed(() => !grid.userHasRevealed() && grid.openedCount < grid.total)

const state = computed(() => {
  const mine = myReveal.value
  if (!mine) return canOpen.value ? 'can-open' : 'lost'
  const t = mine.prize?.type
  if (t === 'grand') return 'grand'
  if (t === 'consolation') return 'consolation'
  return 'lost'
})

const label = computed(() => {
  switch (state.value) {
    case 'can-open':
      return 'Je kunt nog een vakje openen'
    case 'lost':
      return 'Je beurt is geweest – bedankt voor het meespelen!'
    case 'consolation':
      return 'Gefeliciteerd! Je hebt een troostprijs gewonnen'
    case 'grand':
      return 'Fantastisch! Je hebt de hoofdprijs gewonnen'
  }
  return ''
})
</script>

<template>
  <div class="state-banner playstate" :class="'playstate--' + state">
    <Icon v-if="state === 'can-open'" icon="mdi:lock-open-variant" aria-hidden="true" />
    <Icon v-else-if="state === 'lost'" icon="mdi:close-octagon" aria-hidden="true" />
    <Icon v-else-if="state === 'consolation'" icon="mdi:gift" aria-hidden="true" />
    <Icon v-else icon="mdi:diamond-stone" aria-hidden="true" />
    <span class="label">{{ label }}</span>
  </div>
</template>

<style scoped>
.state-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  margin: 0 0 12px 0;
}
.state-banner .label {
  font-weight: 700;
}
</style>
