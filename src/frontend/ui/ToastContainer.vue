<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToastStore } from '@/frontend/ui/toast.store'

const toast = useToastStore()
const { items } = storeToRefs(toast)
</script>

<template>
  <div class="toast-container" aria-live="polite" aria-atomic="true">
    <div
      v-for="t in items"
      :key="t.id"
      class="toast"
      :class="t.type"
      role="status"
    >
      <span class="msg">{{ t.message }}</span>
      <button class="close" type="button" aria-label="Sluiten" @click="toast.remove(t.id)">✕</button>
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 260px;
  max-width: min(90vw, 360px);
  padding: 10px 12px;
  border-radius: 8px;
  background: #222;
  color: #fff;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}
.toast.info { background: #2b6cb0; }
.toast.success { background: #2f855a; }
.toast.error { background: #c53030; }
.msg { flex: 1; }
.close {
  appearance: none;
  background: transparent;
  border: 0;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
}
</style>
