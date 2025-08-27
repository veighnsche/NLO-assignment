<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AdminBar from './frontend/features/admin/components/AdminBar.vue'
import TopBar from '@/frontend/features/chrome/components/TopBar.vue'
import Header from '@/frontend/features/chrome/components/Header.vue'
import Footer from '@/frontend/features/chrome/components/Footer.vue'
import GameSection from '@/frontend/features/game/components/GameSection.vue'
import InitScreen from '@/frontend/features/game/components/InitScreen.vue'
import { useGridStore } from '@/frontend/features/game/store/grid'

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
  <template v-else>
    <Header />
    <GameSection />
    <Footer />
  </template>
  <AdminBar v-if="showAdminBar" @toggle="showAdminBar = false" />
</template>

<style scoped></style>
