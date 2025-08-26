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
  color: #666;
  font-size: 0.95rem;
}
</style>
