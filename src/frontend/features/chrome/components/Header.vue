<script setup lang="ts">
defineOptions({ name: 'AppHeader' })
import { computed } from 'vue'
import { useSessionStore } from '@/frontend/features/game/store/session'
import PrizeBadge from '@/frontend/ui/PrizeBadge.vue'
import PlayStateBanner from '@/frontend/features/game/components/PlayStateBanner.vue'

const props = defineProps<{
  title?: string
}>()

const session = useSessionStore()

// Active player name (admin-selected or assigned)
const playerName = computed(() => session.activePlayerName)


// Prize model (frontend mirrors backend constants: 100 and 25,000)
const CONSOLATION_COUNT = 100
const CONSOLATION_AMOUNT = 100
const GRAND_COUNT = 1
const GRAND_AMOUNT = 25000

// Labels can be built inline in template; avoid unused computed values
</script>

<template>
  <div class="game-header">
    <div class="ds-container">
      <h2 v-if="props.title" class="overline">{{ props.title }}</h2>

      <!-- Spectacular greeting -->
      <div class="greeting spectacular" aria-live="polite">
        <span class="hi">Hallo</span>
        <span class="name">{{ playerName || '—' }}</span>
      </div>

      <!-- Prize highlights -->
      <div class="prize-strip" role="group" aria-label="Te winnen prijzen">
        <PrizeBadge
          variant="consolation"
          :count="CONSOLATION_COUNT"
          :amount="CONSOLATION_AMOUNT"
          label="troostprijs"
          aria-label="Honderd troostprijzen van 100 euro"
        />
        <PrizeBadge
          variant="grand"
          :count="GRAND_COUNT"
          :amount="GRAND_AMOUNT"
          label="hoofdprijs"
          aria-label="Eén hoofdprijs van 25.000 euro"
        />
      </div>

      <!-- Single-source Play State Banner remains -->
      <PlayStateBanner />
    </div>
  </div>
</template>

<style scoped>
.game-header > .ds-container {
  padding: 0.5rem 1rem 0.25rem;
}

/* Overline label */
.overline {
  margin: 0 0 0.25rem 0;
  font-size: var(--fs-overline);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--text) 72%, var(--border-subtle));
}

/* Spectacular greeting */
.greeting.spectacular {
  margin: 2px 0 6px 0;
  font-family: var(--font-family-display);
  font-weight: var(--font-weight-bold);
  font-size: clamp(28px, 6.2vw, 56px);
  line-height: 1.05;
  letter-spacing: 0.2px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  text-shadow: 0 1px 0 rgba(255,255,255,0.35);
}
.greeting .hi {
  color: var(--color-accent-gold);
}
.greeting .name {
  color: var(--color-primary-green);
}

/* Prize strip */
.prize-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 4px 0 8px 0;
}
</style>
