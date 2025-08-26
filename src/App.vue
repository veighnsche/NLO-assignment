<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminBar from './admin/components/AdminBar.vue'
import TopBar from './frontend/components/TopBar.vue'
import GameSection from './frontend/components/GameSection.vue'
import InitScreen from './frontend/components/InitScreen.vue'

const showAdminBar = ref(true)
const isInitializing = ref(true)

async function initApp() {
  // TODO: put real startup work here (e.g., load config, hydrate stores, auth)
  try {
    // await someAsyncSetup()
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
  <AdminBar v-if="showAdminBar" />
</template>

<style scoped>
</style>
