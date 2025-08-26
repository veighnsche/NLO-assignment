<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminBar from './admin/components/AdminBar.vue'
import TopBar from './frontend/components/TopBar.vue'
import GameSection from './frontend/components/GameSection.vue'
import InitScreen from './frontend/components/InitScreen.vue'
import { apiBoot, apiAdminReset } from '@/frontend/api'

const showAdminBar = ref(true)
const isInitializing = ref(true)

function getSavedSeed(): number | undefined {
  const raw = localStorage.getItem('nlo-seed')
  if (raw == null || raw === '') return undefined
  const n = Number(raw)
  return Number.isNaN(n) ? undefined : n
}

async function initApp() {
  try {
    // Initialize the backend via MSW HTTP endpoint with optional saved seed
    await apiBoot(getSavedSeed())
    // Place to hydrate stores or fetch snapshot if needed
  } finally {
    isInitializing.value = false
  }
}

async function onReset(seed?: number) {
  // Show InitScreen while resetting backend state
  isInitializing.value = true
  try {
    if (typeof seed === 'number') {
      localStorage.setItem('nlo-seed', String(seed))
    } else {
      localStorage.removeItem('nlo-seed')
    }
    await apiAdminReset('hard', seed)
  } finally {
    isInitializing.value = false
  }
}

onMounted(() => { void initApp() })
</script>

<template>
  <TopBar :showAdminBar="showAdminBar" @toggle="showAdminBar = !showAdminBar" />
  <InitScreen v-if="isInitializing" />
  <GameSection v-else />
  <AdminBar v-if="showAdminBar" @reset="onReset" />
</template>

<style scoped>
</style>
