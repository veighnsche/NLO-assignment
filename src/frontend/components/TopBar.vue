<template>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="topbar-left">
        <h1 class="topbar-title">{{ title }}</h1>
      </div>
      <div class="topbar-spacer"></div>
      <div class="topbar-right">
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
import { withDefaults, defineProps } from 'vue'
import UiButton from './ui/Button.vue'

const { showAdminBar, title } = withDefaults(
  defineProps<{ showAdminBar: boolean; title?: string }>(),
  {
    title: 'Verrassingskalender',
  },
)
defineEmits<{ (e: 'toggle'): void }>()
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
</style>
