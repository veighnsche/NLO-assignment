<template>
  <div class="admin-bar">
    <div class="section left">
      <span class="label">Actieve speler:</span>
      <span class="value">—</span>
      <Button>Verander van speler</Button>
    </div>

    <div class="section center">
      <label class="slider">
        <span class="label">Botsnelheid</span>
        <input
          type="range"
          min="200"
          max="3000"
          step="100"
          v-model.number="botSpeedMs"
          @input="emitBotSpeed()"
          aria-label="Stel de botsnelheid in"
        />
        <span class="value">{{ botSpeedMs }} ms</span>
      </label>
    </div>

    <div class="section right">
      <Button color="danger" variant="outline" @click="showModal = true">Reset spel…</Button>
      <Button
        icon
        variant="text"
        size="sm"
        aria-label="Sluit adminbalk"
        title="Sluit adminbalk"
        @click="$emit('toggle')"
      >
        ✕
      </Button>
    </div>
  </div>

  <Modal v-model="showModal" :ariaLabelledby="'reset-title'">
    <h2 id="reset-title">Weet je zeker dat je wilt resetten?</h2>
    <p class="subtext">Optioneel: geef een seednummer op.</p>

    <label class="seed-label">
      <span>Seed</span>
      <input type="number" inputmode="numeric" v-model="seed" placeholder="Bijv. 42" />
    </label>

    <template #footer>
      <Button @click="closeModal">Annuleren</Button>
      <Button color="danger" @click="confirmReset">Resetten</Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue'
import Modal from '@/frontend/components/ui/Modal.vue'
import Button from '@/frontend/components/ui/Button.vue'
import { useAdminControls } from '@/admin/useAdminControls'

const showModal = ref(false)
const seed = ref<number | null>(null)
const botSpeedMs = ref(1500)
const { reset: adminReset, setBotSpeed } = useAdminControls()

defineEmits<{ (e: 'toggle'): void }>()

function closeModal() {
  showModal.value = false
}

async function confirmReset() {
  // Persist chosen seed locally like before (used on next boot)
  const raw = seed.value
  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    localStorage.setItem('nlo-seed', String(raw))
  } else {
    localStorage.removeItem('nlo-seed')
  }
  await adminReset(typeof raw === 'number' && !Number.isNaN(raw) ? raw : undefined)
  showModal.value = false
}

async function emitBotSpeed() {
  const interval = Math.max(100, Math.floor(botSpeedMs.value))
  // Map a single speed control to a backend delay window
  const minMs = Math.max(0, Math.round(interval * 0.5))
  const maxMs = Math.max(minMs, Math.round(interval * 1.5))
  await setBotSpeed({ intervalMs: interval, minMs, maxMs })
}
</script>

<style scoped>
.admin-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  height: 80px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #111;
  /* Softer, larger stripes with a subtle white overlay to reduce busyness */
  background:
    linear-gradient(rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.35)),
    repeating-linear-gradient(30deg, #ffe14d 0 40px, #2b2b2b 40px 80px);
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.2);
}

.section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section.center {
  justify-content: center;
}

.section.right {
  justify-content: flex-end;
}

.slider {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.slider input[type='range'] {
  width: 220px;
}

.label {
  font-weight: 600;
}

.value {
  font-variant-numeric: tabular-nums;
}

/* Buttons */
.btn {
  appearance: none;
  border: 1px solid #cfcfcf;
  background: #fff;
  color: #333;
  padding: 8px 12px;
  border-radius: 6px;
  font: inherit;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.btn:hover {
  background: #f7f7f7;
  border-color: #bdbdbd;
}

.btn:active {
  background: #efefef;
}

.btn-danger {
  border-color: #e57373;
  background: #ffebee;
  color: #c62828;
}

.btn-danger:hover {
  background: #ffcdd2;
  border-color: #ef5350;
}

.btn-danger:active {
  background: #ef9a9a;
}

/* Icon button */
/* Icon button now uses UiButton's icon mode */

.subtext {
  margin: 0 0 12px;
  color: #555;
}

.seed-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.seed-label input {
  border: 1px solid #cfcfcf;
  border-radius: 6px;
  padding: 8px 10px;
  font: inherit;
  outline: none;
}

.seed-label input:focus {
  border-color: #7aa7ff;
  box-shadow: 0 0 0 3px rgba(100, 150, 255, 0.2);
}

/* Modal actions now provided by Modal.vue footer styling */
</style>
