<script setup lang="ts">
import { ref } from 'vue'
import AdminBar from './admin/components/AdminBar.vue'
import TopBar from './frontend/components/TopBar.vue'

const showAdminBar = ref(true)
</script>

<template>
  <TopBar :showAdminBar="showAdminBar" @toggle="showAdminBar = !showAdminBar" />

  <h1>You did het!</h1>
  <p>
    Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
    documentation
  </p>

  <AdminBar v-if="showAdminBar" />
</template>

<style scoped>
</style>
