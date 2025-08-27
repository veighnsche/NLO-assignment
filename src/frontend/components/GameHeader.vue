<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  title?: string
  // Header no longer handles metrics; keep optional title only
}>()
</script>

<template>
  <div class="game-header">
    <h2 v-if="props.title">{{ props.title }}</h2>
    <div class="greeting" aria-live="polite">-</div>
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
</style>
