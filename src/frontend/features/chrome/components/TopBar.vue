<template>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="topbar-left">
        <h1 class="topbar-title">{{ title }}</h1>
        <nav class="main-nav" aria-label="Hoofdmenu">
          <a href="#">Loten kopen</a>
          <a href="#">Abonnement</a>
          <a href="#">Uitslagen</a>
          <a href="#">Speluitleg</a>
          <a href="#">Mijn account</a>
        </nav>
      </div>
      <div class="topbar-spacer"></div>
      <div class="topbar-right">
        <div class="links" aria-label="Snelkoppelingen">
          <a href="#">Alle spellen</a>
          <a href="#">Klantenservice</a>
          <a href="#">Registreren</a>
        </div>
        <div class="net-indicator" :class="networkOk ? 'ok' : 'down'" :aria-live="'polite'">
          <span class="dot" aria-hidden="true"></span>
          <span class="label">{{ networkOk ? 'Verbonden' : 'Offline' }}</span>
        </div>
        <UiButton
          class="admin-toggle"
          color="primary"
          variant="outline"
          size="sm"
          :aria-pressed="showAdminBar ? 'true' : 'false'"
          @click="$emit('toggle')"
        >
          {{ showAdminBar ? 'Verberg adminbalk' : 'Toon adminbalk' }}
        </UiButton>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { toRefs, computed } from 'vue'
import UiButton from '@/frontend/ui/Button.vue'
import { useStatusStore } from '@/frontend/features/game/store/status'

const props = withDefaults(defineProps<{ showAdminBar: boolean; title?: string }>(), {
  title: 'Verrassingskalender',
})
const { showAdminBar, title } = toRefs(props)
defineEmits<{ (e: 'toggle'): void }>()

// Connectivity indicator
const status = useStatusStore()
const networkOk = computed(() => status.networkOk)
</script>

<style scoped>
/* Topbar */
.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--surface-elevated);
  color: var(--text);
  border-bottom: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-md);
  z-index: 1500;
}

.topbar-inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.topbar-spacer {
  flex: 1;
}

/* Button-specific rules removed; UiButton uses theme tokens */

/* Title */
.topbar-title {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1;
}

.main-nav {
  display: none;
  gap: 10px;
}
.main-nav a {
  color: var(--text);
  text-decoration: none;
  padding: 6px 8px;
  border-radius: 999px;
  line-height: 1;
}
.main-nav a:hover {
  background: color-mix(in srgb, var(--color-primary-green) 12%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-green) 35%, var(--border-subtle));
}

/* Show main nav on >=768px */
@media (min-width: 768px) {
  .main-nav {
    display: inline-flex;
  }
}

/* Network indicator */
.net-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: var(--surface);
  font-size: 0.85rem;
}
.net-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.04) inset;
}
.net-indicator.ok .dot {
  background: var(--state-success);
}
.net-indicator.down .dot {
  background: var(--state-danger);
}
.net-indicator .label {
  color: var(--text-muted, #777);
}

.topbar-right {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.topbar-right .links {
  display: none;
  gap: 12px;
}
.topbar-right .links a {
  color: var(--text);
  text-decoration: none;
  opacity: 0.9;
}
.topbar-right .links a:hover {
  color: var(--color-primary-green);
  text-decoration: underline;
  text-underline-offset: 2px;
}
@media (min-width: 900px) {
  .topbar-right .links {
    display: inline-flex;
  }
}

/* Ensure admin toggle doesn't change layout when text swaps */
.admin-toggle {
  min-width: 18ch; /* fits both labels */
  justify-content: center;
  text-align: center;
}
</style>
