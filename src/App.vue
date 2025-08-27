<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AdminBar from './admin/components/AdminBar.vue'
import TopBar from './frontend/components/TopBar.vue'
import GameSection from './frontend/components/GameSection.vue'
import InitScreen from './frontend/components/InitScreen.vue'
import { useGridStore } from '@/frontend/store/grid'

const showAdminBar = ref(true)
const isInitializing = ref(true)
const grid = useGridStore()

function getSavedSeed(): number | undefined {
  const raw = localStorage.getItem('nlo-seed')
  if (raw == null || raw === '') return undefined
  const n = Number(raw)
  return Number.isNaN(n) ? undefined : n
}

async function initApp() {
  try {
    // Initialize backend state and hydrate the store
    await grid.boot(getSavedSeed())
    // Simulate other users by starting bot polling
    grid.startBotPolling(1500)
  } finally {
    isInitializing.value = false
  }
}

// Admin actions (reset, bot speed) are handled inside AdminBar.vue now

onMounted(() => {
  void initApp()
})
onUnmounted(() => {
  grid.stopBotPolling()
})
</script>

<template>
  <TopBar :showAdminBar="showAdminBar" @toggle="showAdminBar = !showAdminBar" />
  <InitScreen v-if="isInitializing" />
  <GameSection v-else />
  <AdminBar v-if="showAdminBar" @toggle="showAdminBar = false" />
</template>

<style scoped></style>
