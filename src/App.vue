<script setup lang="ts">
import { ref } from 'vue'
import AdminBar from './admin/components/AdminBar.vue'
import TopBar from './frontend/components/TopBar.vue'
import GameSection from './frontend/components/GameSection.vue'

const showAdminBar = ref(true)
</script>

<template>
  <TopBar :showAdminBar="showAdminBar" @toggle="showAdminBar = !showAdminBar" />
  <GameSection />
  <AdminBar v-if="showAdminBar" />
</template>

<style scoped>
</style>
