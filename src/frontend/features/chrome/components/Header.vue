<script setup lang="ts">
defineOptions({ name: 'AppHeader' })
import { computed } from 'vue'
import { useSessionStore } from '@/frontend/features/game/store/session'
import PrizeCard from '@/frontend/features/chrome/ui/PrizeCard.vue'
import PlayStateBanner from '@/frontend/features/game/components/PlayStateBanner.vue'
import {
  CONSOLATION_COUNT,
  CONSOLATION_AMOUNT,
  GRAND_COUNT,
  GRAND_AMOUNT,
} from '@/shared/constants/prizes'

const props = defineProps<{
  title?: string
}>()

const session = useSessionStore()

// Active player name (admin-selected or assigned)
const playerName = computed(() => session.activePlayerName)

// Prize model is centralized in '@/shared/constants/prizes'

// Labels can be built inline in template; avoid unused computed values
</script>

<template>
  <div class="game-header">
    <div class="ds-container">
      <h2 v-if="props.title" class="overline">{{ props.title }}</h2>

      <!-- Spectacular greeting -->
      <div class="topbar-row">
        <div class="greeting spectacular" aria-live="polite">
          <span class="hi">Hallo</span>
          <span class="name">{{ playerName || '—' }}</span>
          <span class="note" aria-hidden="true">(fictief)</span>
        </div>

        <!-- Single-source Play State Banner remains -->
        <PlayStateBanner />
      </div>

      <!-- Prize highlights -->
      <div class="prize-strip" role="group" aria-label="Te winnen prijzen">
        <PrizeCard
          variant="consolation"
          :count="CONSOLATION_COUNT"
          :amount="CONSOLATION_AMOUNT"
          label="troostprijs"
          aria-label="Honderd troostprijzen van 100 euro"
        />
        <PrizeCard
          variant="grand"
          :count="GRAND_COUNT"
          :amount="GRAND_AMOUNT"
          label="hoofdprijs"
          aria-label="Eén hoofdprijs van 25.000 euro"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-header {
  background: var(--header-bg);
  color: var(--header-text);
  border-bottom: 1px solid var(--header-border);
}

.game-header > .ds-container {
  padding: var(--header-container-padding);
}

/* Overline label */
.overline {
  margin: 0 0 0.5rem 0;
  font-size: var(--fs-overline);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--text) 72%, var(--border-subtle));
}

/* Spectacular greeting */
.greeting.spectacular {
  margin: var(--greeting-margin);
  font-family: var(--font-family-display);
  font-weight: var(--font-weight-bold);
  font-size: var(--greeting-size);
  line-height: 1.02;
  letter-spacing: 0.2px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--greeting-gap);
  flex-wrap: wrap;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
}
.topbar-row {
  display: flex;
  flex-direction: var(--header-topbar-direction);
  align-items: var(--header-topbar-align);
  justify-content: var(--header-topbar-justify);
  gap: 10px;
  margin: 0.5rem 0 1rem 0;
}
.topbar-row :where(.state-banner) {
  margin: 0; /* remove extra space when inside the row */
}
.greeting .hi {
  color: var(--color-accent-gold);
  font-size: var(--greeting-hi-scale); /* scale Hallo up via tokens */
  line-height: 1;
}
.greeting .name {
  color: var(--color-primary-green);
  font-size: 1em; /* keep name smaller than Hallo */
}

.greeting .note {
  color: color-mix(in srgb, var(--text) 60%, var(--border-subtle));
  font-size: 0.45em;
  line-height: 1;
}

/* Prize strip */
.prize-strip {
  display: grid;
  grid-template-columns: auto auto;
  justify-content: center;
  align-items: start;
  gap: var(--prize-strip-gap);
  margin: var(--prize-strip-margin);
}
</style>
