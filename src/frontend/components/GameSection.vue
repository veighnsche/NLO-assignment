<script setup lang="ts">
// 100x100 grid (10,000 cells)
const rows = 100
const cols = 100
const cells = Array.from({ length: rows * cols }, (_, i) => i)
</script>

<template>
  <section class="game-section">
    <h2>Verrassingskalender</h2>
    <div
      class="calendar-grid"
      role="grid"
      :aria-rowcount="rows"
      :aria-colcount="cols"
    >
      <button
        v-for="id in cells"
        :key="id"
        class="cell"
        role="gridcell"
        aria-label="Gesloten vakje"
      />
    </div>
  </section>
</template>

<style scoped>
.game-section {
  padding: 1rem;
}

.calendar-grid {
  /* 100 columns grid */
  display: grid;
  grid-template-columns: repeat(100, 1fr);
  gap: 2px;
  width: 100%;
  user-select: none;
}

.cell {
  /* Keep cells square regardless of width */
  aspect-ratio: 1 / 1;
  background: #f2f2f2;
  border: 1px solid #e0e0e0;
  padding: 0;
  cursor: pointer;
}

.cell:focus-visible {
  outline: 2px solid #2b6cb0;
  outline-offset: -2px;
}
</style>
