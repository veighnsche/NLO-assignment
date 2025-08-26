<template>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="topbar-left">
        <!-- Voeg hier eventueel een titel/logo toe -->
      </div>
      <div class="topbar-spacer"></div>
      <div class="topbar-right">
        <UiButton
          color="primary"
          variant="outline"
          size="sm"
          @click="$emit('toggle')"
        >
          {{ showAdminBar ? 'Verberg adminbalk' : 'Toon adminbalk' }}
        </UiButton>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import UiButton from './ui/Button.vue'

defineProps<{ showAdminBar: boolean }>()
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

.topbar-spacer { flex: 1; }

/* Button-specific rules removed; UiButton uses theme tokens */
</style>
