<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  title?: string
  openedCount: number
  total: number
}>()
</script>

<template>
  <header class="game-header">
    <h2>{{ props.title ?? 'Verrassingskalender' }}</h2>
    <p class="counts">Geopend: {{ props.openedCount }} / {{ props.total }}</p>
  </header>
</template>

<style scoped>
.game-header {
  padding: 1rem 1rem 0.5rem 1rem;
}

.counts {
  margin: 0 0 0.5rem 0;
  color: color-mix(in srgb, var(--text) 65%, var(--color-silver));
  font-size: 0.95rem;
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
</style>
