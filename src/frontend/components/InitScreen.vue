<script setup lang="ts">
// Basic init screen. Customize as needed via slots.
</script>

<template>
  <section class="init-screen" role="status" aria-live="polite">
    <div class="card">
      <div class="spinner" aria-hidden="true" />
      <h2>Preparing your experience…</h2>
      <p>Loading data and setting things up. This should only take a moment.</p>
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
  border: 1px solid #e5e7eb; /* gray-200 */
  border-radius: 12px;
  background: #fff;
  color: #111827; /* gray-900 */
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  text-align: center;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6; /* blue-500 */
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

h2 {
  margin: 0.25rem 0 0;
  font-size: 1.1rem;
}

p {
  margin: 0;
  color: #6b7280; /* gray-500 */
}
</style>
