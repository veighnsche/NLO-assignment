<script setup lang="ts">
// Eenvoudig opstartscherm. Pas desgewenst aan via slots.
</script>

<template>
  <section class="init-screen" role="status" aria-live="polite" aria-busy="true">
    <div class="card">
      <div class="spinner" aria-hidden="true" />
      <h2>Je ervaring wordt voorbereid…</h2>
      <p>Gegevens laden en alles klaarzetten. Dit duurt maar een ogenblik.</p>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.init-screen {
  display: grid;
  place-items: center;
  min-height: 40vh;
  padding: 1.5rem;
}

.card {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-elevated);
  color: var(--text);
  box-shadow: var(--shadow-md);
  text-align: center;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--border-subtle);
  /* Use an accent/state token for the animated ring */
  border-top-color: var(--state-info);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

h2 {
  margin: 0.25rem 0 0;
  font-size: 1.1rem;
}

p {
  margin: 0;
  /* Subtle secondary text using tokenized mix */
  color: color-mix(in srgb, var(--text) 65%, white);
}
</style>
