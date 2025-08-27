<template>
  <footer class="game-footer" aria-label="Voettekst">
    <div class="footer-inner">
      <div class="footer-left">
        <span class="brand">Verrassingskalender</span>
      </div>
      <nav class="footer-nav" aria-label="Footer links">
        <a href="#" @click.prevent title="Over ons (fictief)">Over ons</a>
        <span class="sep" aria-hidden="true">·</span>
        <a href="#" @click.prevent title="Privacybeleid (fictief)">Privacy</a>
        <span class="sep" aria-hidden="true">·</span>
        <a href="#" @click.prevent title="Voorwaarden (fictief)">Voorwaarden</a>
        <span class="sep" aria-hidden="true">·</span>
        <a href="#" @click.prevent title="Contact (fictief)">Contact</a>
        <span class="sep" aria-hidden="true">·</span>
        <a href="#" @click.prevent title="Help (fictief)">Help</a>
      </nav>
      <div class="footer-spacer" />
      <div class="footer-right">
        <span class="meta">Nog {{ remaining }} van {{ total }} te openen</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGridStore } from '@/frontend/store/grid'

const grid = useGridStore()
const total = computed(() => grid.total)
const remaining = computed(() => Math.max(0, grid.total - grid.openedCount))
</script>

<style scoped>
.game-footer {
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--surface-elevated);
  color: var(--text);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.footer-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
}

.footer-nav a {
  color: color-mix(in srgb, var(--text) 85%, #888);
  text-decoration: none;
}

.footer-nav a:hover,
.footer-nav a:focus-visible {
  text-decoration: underline;
}

.footer-nav .sep {
  color: #a9a9a9;
}

.footer-spacer {
  flex: 1;
}

.brand {
  font-weight: 600;
}

.meta {
  color: #7d7d7d;
  font-variant-numeric: tabular-nums;
}
</style>
