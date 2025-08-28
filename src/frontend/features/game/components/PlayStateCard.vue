<script setup lang="ts">
import { computed } from 'vue'
import { useGridStore } from '@/frontend/features/game/store/grid'
import { useSessionStore } from '@/frontend/features/game/store/session'

const props = defineProps<{
  backgroundImage?: string
  mediaAspect?: string | number // default 16/9
}>()

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

const resolvedMediaAspect = computed(() => props.mediaAspect ?? '16/9')

// Map each state to a public asset. Place these files in /public
// /playstate-can-open.png, /playstate-lost.png, /playstate-consolation.png, /playstate-grand.png
const imageMap = computed(() => ({
  'can-open': '/playstate-can-open.png',
  lost: '/playstate-lost.png',
  consolation: '/playstate-consolation.png',
  grand: '/playstate-grand.png',
}))

// Allow explicit override via backgroundImage prop; otherwise use the per-state image
const mediaUrl = computed(() => props.backgroundImage ?? imageMap.value[state.value as keyof typeof imageMap.value])
</script>

<template>
  <div class="playstate-card" :class="'state--' + state">
    <div
      class="card-media"
      aria-hidden="true"
      :style="{
        aspectRatio: String(resolvedMediaAspect),
        backgroundImage: mediaUrl ? `url(${mediaUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }"
    >
    </div>

    <div class="card-content">
      <div class="headline">Speelstatus</div>
      <div class="label">{{ label }}</div>
    </div>
  </div>
</template>

<style scoped>
.playstate-card {
  display: grid;
  grid-template-rows: auto 1fr;
  align-items: start;
  gap: 0;
  width: clamp(275px, 40vw, 400px); /* ~1.25x PrizeCard (220px, 32vw, 320px) */
  border-radius: var(--radius-xl);
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.05)) padding-box,
    var(--card-bg, var(--surface)) border-box;
  border: 1px solid var(--card-border, var(--border-subtle));
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.5) inset,
    0 6px 24px rgba(0, 0, 0, 0.12),
    0 14px 36px rgba(0, 0, 0, 0.08),
    0 0 34px var(--glow-color, transparent); /* subtle outer glow */
}

.card-media {
  width: 100%;
  background: var(--card-media-bg, linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0)));
  position: relative;
}

.card-content {
  display: grid;
  gap: 8px;
  padding: 12px 14px 16px;
}

.headline {
  font-weight: var(--font-weight-semibold, 700);
  font-size: var(--fs-small, 14px);
  opacity: 0.85;
  letter-spacing: 0.02em;
}

.label {
  font-family: var(--font-family-display);
  font-weight: var(--font-weight-bold);
  font-size: clamp(18px, 2.4vw, 26px);
  line-height: 1.2;
}

/* State palettes */
.playstate-card.state--grand {
  --glow-color: color-mix(in srgb, var(--color-accent-gold) 28%, transparent);
  --card-bg: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent-gold) 70%, #fff) 0%,
    color-mix(in srgb, var(--color-accent-gold) 35%, #fff) 45%,
    color-mix(in srgb, var(--color-accent-gold) 60%, var(--surface)) 100%
  );
  --card-border: color-mix(in srgb, var(--color-accent-gold) 65%, var(--border-subtle));
  --card-media-bg: linear-gradient(180deg, rgba(218, 165, 32, 0.15), rgba(218, 165, 32, 0));
}

.playstate-card.state--consolation {
  --glow-color: color-mix(in srgb, var(--color-primary-green) 22%, transparent);
  --card-bg: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary-green) 30%, #fff) 0%,
    color-mix(in srgb, var(--color-primary-green) 18%, #fff) 45%,
    color-mix(in srgb, var(--color-primary-green) 35%, var(--surface)) 100%
  );
  --card-border: color-mix(in srgb, var(--color-primary-green) 45%, var(--border-subtle));
  --card-media-bg: linear-gradient(180deg, rgba(0, 128, 0, 0.12), rgba(0, 128, 0, 0));
}

.playstate-card.state--lost {
  --glow-color: color-mix(in srgb, #777 18%, transparent);
  --card-bg: linear-gradient(
    135deg,
    color-mix(in srgb, #999 18%, #fff) 0%,
    color-mix(in srgb, #999 10%, #fff) 45%,
    color-mix(in srgb, #777 20%, var(--surface)) 100%
  );
  --card-border: color-mix(in srgb, #777 35%, var(--border-subtle));
}

.playstate-card.state--can-open {
  --glow-color: color-mix(in srgb, var(--color-accent-blue, #4b9cff) 22%, transparent);
  --card-bg: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent-blue, #4b9cff) 26%, #fff) 0%,
    color-mix(in srgb, var(--color-accent-blue, #4b9cff) 14%, #fff) 45%,
    color-mix(in srgb, var(--color-accent-blue, #4b9cff) 24%, var(--surface)) 100%
  );
  --card-border: color-mix(in srgb, var(--color-accent-blue, #4b9cff) 35%, var(--border-subtle));
}

@media (max-width: 700px) {
  .playstate-card {
    width: min(100%, 520px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .playstate-card {
    transition: none;
  }
}
</style>
