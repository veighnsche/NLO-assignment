<template>
  <div class="admin-bar">
    <div class="bar-card">
      <div class="section left">
        <span class="label">Actieve speler:</span>
        <span class="value">{{ currentPlayerName || '—' }}</span>
        <Button>Verander van speler</Button>
      </div>

      <div class="section center">
        <Slider
          v-model="botSpeedHz"
          :min="0.3"
          :max="10"
          :step="0.1"
          label="Botsnelheid"
          suffix=" /s"
          :decimals="1"
          @input="scheduleSetSpeed()"
        />
        <Button size="sm" variant="outline" @click="resetBotSpeed">Reset snelheid</Button>
        <Button size="sm" variant="outline" @click="toggleExpose">
          {{ grid.showExposed ? 'Verberg prijzen' : 'Toon prijzen' }}
        </Button>
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
import { ref, defineEmits, onMounted, watch } from 'vue'
import Modal from '@/frontend/shared/ui/Modal.vue'
import Button from '@/frontend/shared/ui/Button.vue'
import Slider from '@/frontend/shared/ui/Slider.vue'
import { useAdminControls } from '@/frontend/features/admin/useAdminControls'
import { useGridStore } from '@/frontend/features/game/store/grid'
import { apiAdminGetCurrentPlayer, apiUsersResolve, apiUsersAssign } from '@/frontend/shared/api/client'

const showModal = ref(false)
const seed = ref<number | null>(null)
// Slider now represents actions per second (Hz). Right = faster
const botSpeedHz = ref(1.0)
let speedTimer: number | null = null
const { reset: adminReset, setBotSpeed, getBotDelay } = useAdminControls()
const grid = useGridStore()

// Current player display
const currentPlayerId = ref<string | undefined>(undefined)
const currentPlayerName = ref<string>('')
// Stable client id (same approach as Header.vue)
const clientId = (() => {
  const storageKey = 'nlo-player-id'
  try {
    const existing = localStorage.getItem(storageKey)
    if (existing) return existing
    const rnd = crypto.getRandomValues(new Uint32Array(4))
    const v = Array.from(rnd).map((n) => n.toString(16).padStart(8, '0')).join('')
    localStorage.setItem(storageKey, v)
    return v
  } catch {
    return `anon-${Math.random().toString(36).slice(2)}`
  }
})()

async function refreshCurrentPlayer() {
  try {
    const { currentPlayerId: id } = await apiAdminGetCurrentPlayer()
    currentPlayerId.value = id
    if (id) {
      const res = await apiUsersResolve([id])
      currentPlayerName.value = res.users[0]?.name ?? ''
      return
    }
    // Fallback: show this browser's assigned user name
    const assigned = await apiUsersAssign(clientId)
    currentPlayerName.value = assigned.name || ''
  } catch {
    // ignore in dev
    currentPlayerName.value = ''
  }
}

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

function scheduleSetSpeed() {
  if (speedTimer != null) window.clearTimeout(speedTimer)
  speedTimer = window.setTimeout(async () => {
    const speed = Math.max(0.1, Number(botSpeedHz.value) || 1)
    // Convert speed (actions/sec) to base interval in ms
    const interval = Math.max(100, Math.round(1000 / speed))
    // Map single control to a backend delay window around the interval
    const minMs = Math.max(0, Math.round(interval * 0.5))
    const maxMs = Math.max(minMs, Math.round(interval * 1.5))
    await setBotSpeed({ intervalMs: interval, minMs, maxMs })
    speedTimer = null
  }, 250)
}

function toggleExpose() {
  grid.toggleExposed()
}

async function resetBotSpeed() {
  // Restore backend defaults and sync UI
  const defaultMin = 300
  const defaultMax = 1500
  const avg = Math.round((defaultMin + defaultMax) / 2)
  // Clear pending debounce to avoid extra network call
  if (speedTimer != null) {
    window.clearTimeout(speedTimer)
    speedTimer = null
  }
  // Update slider (Hz) from ms
  const speed = 1000 / Math.max(1, avg)
  botSpeedHz.value = Math.min(10, Math.max(0.3, Number(speed)))
  await setBotSpeed({ intervalMs: avg, minMs: defaultMin, maxMs: defaultMax })
}

onMounted(async () => {
  try {
    const { minMs, maxMs } = await getBotDelay()
    const avg = Math.max(1, Math.round((minMs + maxMs) / 2))
    // Initialize slider from backend by converting ms -> actions/sec
    const speed = 1000 / avg
    // Clamp to slider boundaries
    botSpeedHz.value = Math.min(10, Math.max(0.3, Number(speed)))
    // Align frontend polling interval with backend range
    await setBotSpeed({ intervalMs: avg, minMs, maxMs })
  } catch {
    // ignore fetch errors in dev
  }
  // Fetch current player name after boot completes (avoid early calls during init)
  if (!grid.isBooting) {
    await refreshCurrentPlayer()
  } else {
    const stop = watch(
      () => grid.isBooting,
      async (booting) => {
        if (!booting) {
          await refreshCurrentPlayer()
          stop()
        }
      },
      { immediate: false },
    )
  }
})
</script>

<style scoped>
.admin-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  height: 100px;
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

.bar-card {
  width: 100%;
  height: 56px;
  background: #fff;
  color: #111;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
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
