<script setup lang="ts">
defineOptions({ name: 'AppHeader' })
import { computed, ref } from 'vue'
import { useGridStore } from '@/frontend/features/game/store/grid'

const props = defineProps<{
  title?: string
  // Header no longer handles metrics; keep optional title only
}>()

// Identify the current user for outcome tracking
const playerId = ref<string>('')
const storageKey = 'nlo-player-id'
try {
  const existing = localStorage.getItem(storageKey)
  if (existing) {
    playerId.value = existing
  } else {
    // lightweight random id
    const rnd = crypto.getRandomValues(new Uint32Array(4))
    playerId.value = Array.from(rnd).map((n) => n.toString(16).padStart(8, '0')).join('')
    localStorage.setItem(storageKey, playerId.value)
  }
} catch {
  // localStorage/crypto may be unavailable in SSR; fall back
  playerId.value = `anon-${Math.random().toString(36).slice(2)}`
}

const grid = useGridStore()

// Derived state for the status card
const canOpen = computed(
  () => !grid.isRevealing && !grid.userHasRevealed() && grid.openedCount < grid.total,
)

type PrizeType = 'none' | 'consolation' | 'grand'
const userPrize = computed<PrizeType | null>(() => {
  if (!grid.userHasRevealed()) return null
  const mine = grid.revealed.find((c) => c.revealedBy === playerId.value)
  return (mine?.prize?.type as PrizeType | undefined) ?? 'none'
})

const cardState = computed(() => {
  // State 1: Unopened and playable
  if (canOpen.value) return 'can-open' as const
  // After opening, map to outcome
  if (userPrize.value === 'grand') return 'won-grand' as const
  if (userPrize.value === 'consolation') return 'won-consolation' as const
  return 'lost' as const
})
</script>

<template>
  <div class="game-header">
    <h2 v-if="props.title">{{ props.title }}</h2>
    <div class="greeting" aria-live="polite">Hallo, -</div>
    <!-- Status Card with 4 states -->
    <div
      class="status-card"
      :class="cardState"
      role="status"
      :aria-live="cardState === 'won-grand' ? 'polite' : 'off'"
    >
      <template v-if="cardState === 'can-open'">
        <span class="icon" aria-hidden="true">🔓</span>
        <span class="text">Je kunt 1 vakje openen</span>
      </template>
      <template v-else-if="cardState === 'lost'">
        <span class="icon" aria-hidden="true">🙁</span>
        <span class="text">Je hebt niets gewonnen</span>
      </template>
      <template v-else-if="cardState === 'won-consolation'">
        <span class="icon" aria-hidden="true">🎁</span>
        <span class="text">Je hebt de troostprijs gewonnen</span>
      </template>
      <template v-else>
        <span class="icon" aria-hidden="true">💎</span>
        <span class="text">Je hebt de hoofdprijs gewonnen</span>
        <span class="burst" aria-hidden="true"></span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.game-header {
  padding: 0.5rem 1rem 0.25rem;
}

h2 {
  margin: 0 0 0.25rem 0;
  color: var(--color-primary-green);
  position: relative;
  padding-bottom: 0.25rem;
}

/* Gold underline accent */
h2::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 64px;
  height: 3px;
  background: var(--color-accent-gold);
  border-radius: var(--radius-sm);
}

.greeting {
  margin: 0 0 0.25rem 0;
}

.status-card {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--surface-elevated) 70%, transparent);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
  color: var(--text);
}

.status-card .icon {
  font-size: 1.1rem;
}
.status-card .text {
  font-weight: 600;
}

/* Variants */
.status-card.can-open {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-green) 55%, white);
  background: color-mix(in srgb, var(--color-primary-green) 22%, transparent);
}

.status-card.lost {
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.status-card.won-consolation {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-green) 55%, white);
  background: color-mix(in srgb, var(--color-primary-green) 25%, transparent);
}

.status-card.won-grand {
  color: black;
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 80%, black),
    0 0 0 3px color-mix(in srgb, var(--color-accent-gold) 25%, transparent),
    0 8px 24px color-mix(in srgb, var(--color-accent-gold) 25%, transparent);
  background: color-mix(in srgb, var(--color-accent-gold) 40%, transparent);
  animation: grandGlow 1.8s ease-in-out infinite alternate;
}

.status-card.won-grand .burst {
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 35%, rgba(255, 255, 255, 0.7), transparent 35%),
    radial-gradient(circle at 80% 65%, rgba(255, 255, 255, 0.5), transparent 40%);
  filter: blur(2px);
}

@keyframes grandGlow {
  from {
    filter: drop-shadow(0 0 0px rgba(255, 215, 0, 0));
  }
  to {
    filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.45));
  }
}
</style>
