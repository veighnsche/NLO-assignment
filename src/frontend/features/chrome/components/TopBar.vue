<template>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="topbar-left">
        <h1 class="topbar-title">{{ title }}</h1>
      </div>
      <div class="topbar-spacer"></div>
      <div class="topbar-right">
        <div class="net-indicator" :class="networkOk ? 'ok' : 'down'" :aria-live="'polite'">
          <span class="dot" aria-hidden="true"></span>
          <span class="label">{{ networkOk ? 'Verbonden' : 'Offline' }}</span>
        </div>
        <UiButton
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
import UiButton from '@/frontend/shared/ui/Button.vue'
import { useGridStore } from '@/frontend/features/game/store/grid'

const props = withDefaults(defineProps<{ showAdminBar: boolean; title?: string }>(), {
  title: 'Verrassingskalender',
})
const { showAdminBar, title } = toRefs(props)
defineEmits<{ (e: 'toggle'): void }>()

// Connectivity indicator
const grid = useGridStore()
const networkOk = computed(() => grid.networkOk)
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
  background: #2ecc71;
}
.net-indicator.down .dot {
  background: #e74c3c;
}
.net-indicator .label {
  color: var(--text-muted, #777);
}
</style>
