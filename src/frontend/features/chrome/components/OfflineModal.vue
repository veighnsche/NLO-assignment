<template>
  <Modal v-model="open" :closeOnOverlay="false" :ariaLabelledby="'offline-title'">
    <h2 id="offline-title">Je bent offline</h2>
    <p class="offline-text">
      Er is geen internetverbinding. Zodra je weer online bent, kun je de pagina verversen om verder te gaan.
    </p>
    <template #footer>
      <Button variant="outline" @click="open = false">Later</Button>
      <Button color="primary" @click="refreshPage">Vernieuwen</Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStatusStore } from '@/frontend/features/game/store/status'
import Modal from '@/frontend/ui/Modal.vue'
import Button from '@/frontend/ui/Button.vue'

defineOptions({ name: 'OfflineModal' })

const status = useStatusStore()
const networkOk = computed(() => status.networkOk)
const open = ref(false)

watch(
  networkOk,
  (ok) => {
    if (!ok) open.value = true
    else open.value = false
  },
  { immediate: true },
)

function refreshPage() {
  window.location.reload()
}
</script>

<style scoped>
.offline-text {
  margin: 8px 0 0;
}
</style>
