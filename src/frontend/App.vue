<script setup lang="ts">
import { ref } from 'vue'
import AdminBar from '@/frontend/features/admin/components/AdminBar.vue'
import TopBar from '@/frontend/features/chrome/components/TopBar.vue'
import Header from '@/frontend/features/chrome/components/Header.vue'
import Footer from '@/frontend/features/chrome/components/Footer.vue'
import GameSection from '@/frontend/features/game/components/GameSection.vue'
import InitScreen from '@/frontend/features/game/components/InitScreen.vue'
import { useGridStore } from '@/frontend/features/game/store/grid'
import { useInitApp } from '@/frontend/features/game/composables/useInitApp'

const showAdminBar = ref(true)
const grid = useGridStore()
const { isInitializing } = useInitApp(grid)
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
