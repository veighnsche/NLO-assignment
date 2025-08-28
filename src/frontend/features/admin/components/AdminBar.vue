<template>
  <div class="admin-bar">
    <div class="admin-header">
      <span class="admin-badge" role="status" aria-label="Admin modus – niet voor productie">
        ADMIN • NOT FOR PRODUCTION
      </span>
    </div>
    <div class="bar-card">
      <div class="section left">
        <span class="label">Actieve speler:</span>
        <span class="value">{{ session.activePlayerName || '—' }}</span>
        <Button @click="pickRandomPlayer">Verander van speler</Button>
      </div>

      <div class="section center">
        <div class="slider-wrap">
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
        </div>
        <Button size="sm" variant="outline" @click="resetBotSpeed">Reset snelheid</Button>
        <Button size="sm" variant="outline" @click="toggleExpose">
          {{ admin.showExposed ? 'Verberg prijzen' : 'Toon prijzen' }}
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
          <Icon icon="mdi:close" aria-hidden="true" />
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
import { ref, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import Modal from '@/frontend/ui/Modal.vue'
import Button from '@/frontend/ui/Button.vue'
import Slider from '@/frontend/ui/Slider.vue'
import { useAdminControls } from '@/frontend/features/admin/useAdminControls'
import { useAdminUiStore } from '@/frontend/features/admin/store/adminUI'
import { useSessionStore } from '@/frontend/features/game/store/session'
import { useStatusStore } from '@/frontend/features/game/store/status'
import {
  hzToIntervalMs,
  intervalWindow,
  clampHz,
  intervalToHz,
  DEFAULT_MIN_MS,
  DEFAULT_MAX_MS,
} from '@/frontend/lib/botSpeed'

const showModal = ref(false)
const seed = ref<number | null>(null)
// No manual change-player modal; backend picks a random eligible player
// Slider now represents actions per second (Hz). Right = faster
const botSpeedHz = ref(1.0)
let speedTimer: number | null = null
const { reset: adminReset, setBotSpeed, getBotDelay, pickRandomPlayer } = useAdminControls()
const admin = useAdminUiStore()
const session = useSessionStore()
const status = useStatusStore()

// Current player display is provided by session store (activePlayerName)

defineEmits<{ (e: 'toggle'): void }>()

function closeModal() {
  showModal.value = false
}

async function confirmReset() {
  const raw = seed.value
  await adminReset(typeof raw === 'number' && !Number.isNaN(raw) ? raw : undefined)
  showModal.value = false
  // Refresh the current player display after a reset
  await session.refreshCurrentPlayer()
}

// --- Change active player (admin) ---

function scheduleSetSpeed() {
  if (speedTimer != null) window.clearTimeout(speedTimer)
  speedTimer = window.setTimeout(async () => {
    const speed = clampHz(Number(botSpeedHz.value) || 1)
    const interval = hzToIntervalMs(speed)
    const { minMs, maxMs } = intervalWindow(interval)
    await setBotSpeed({ intervalMs: interval, minMs, maxMs })
    speedTimer = null
  }, 250)
}

function toggleExpose() {
  admin.toggleExposed()
}

async function resetBotSpeed() {
  // Restore backend defaults and sync UI
  const defaultMin = DEFAULT_MIN_MS
  const defaultMax = DEFAULT_MAX_MS
  const avg = Math.round((defaultMin + defaultMax) / 2)
  // Clear pending debounce to avoid extra network call
  if (speedTimer != null) {
    window.clearTimeout(speedTimer)
    speedTimer = null
  }
  // Update slider (Hz) from ms
  const speed = intervalToHz(avg)
  botSpeedHz.value = clampHz(speed)
  await setBotSpeed({ intervalMs: avg, minMs: defaultMin, maxMs: defaultMax })
}

onMounted(async () => {
  try {
    const { minMs, maxMs } = await getBotDelay()
    const avg = Math.max(1, Math.round((minMs + maxMs) / 2))
    // Initialize slider from backend by converting ms -> actions/sec
    const speed = clampHz(intervalToHz(avg))
    botSpeedHz.value = speed
    // Align frontend polling interval with backend range
    await setBotSpeed({ intervalMs: hzToIntervalMs(speed), minMs, maxMs })
  } catch {
    // ignore fetch errors in dev
  }
  // Fetch current player name after boot completes (avoid early calls during init)
  if (!status.isBooting) {
    await session.refreshCurrentPlayer()
  } else {
    const stop = watch(
      () => status.isBooting,
      async (booting) => {
        if (!booting) {
          await session.refreshCurrentPlayer()
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
  height: var(--adminbar-height);
  padding: var(--adminbar-padding);
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

.admin-header {
  position: var(--adminbar-header-position);
  top: 6px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: var(--adminbar-header-justify);
  pointer-events: var(--adminbar-header-pointer);
  margin: var(--adminbar-header-margin);
  z-index: var(--adminbar-header-z);
}

.bar-card {
  width: 100%;
  height: var(--adminbar-card-height);
  background: #fff;
  color: #111;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: var(--adminbar-card-direction);
  flex-wrap: var(--adminbar-card-wrap);
  align-items: center;
  justify-content: space-between;
  gap: var(--adminbar-card-gap);
  padding: calc(8px + var(--adminbar-card-top-offset)) 12px 8px;
}

.section {
  display: flex;
  align-items: center;
  gap: var(--adminbar-section-gap);
  order: var(--order, 0);
  flex: 0 1 var(--basis, auto);
}

/* Allow the identity/left section to wrap nicely on small screens */
.section.left {
  flex-wrap: var(--adminbar-card-wrap);
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #b00020;
  color: #fff;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  pointer-events: auto; /* restore pointer events for the badge (e.g., text selection) */
}

.section.left {
  --order: var(--adminbar-left-order);
  --basis: var(--adminbar-left-basis);
}
.section.center {
  --order: var(--adminbar-center-order);
  --basis: var(--adminbar-center-basis);
  flex-grow: var(--adminbar-center-grow);
}
.section.right {
  --order: var(--adminbar-right-order);
  --basis: var(--adminbar-right-basis);
}

/* Center section becomes a responsive grid: slider + actions */
.section.center {
  display: grid;
  grid-template-columns: var(--adminbar-center-grid);
  align-items: center;
  justify-content: center;
  width: 100%;
}

/* Make child controls stretch on mobile */
.section.center > * {
  min-width: 0;
  width: var(--adminbar-control-width);
}

/* Stretch actual native controls rendered by child components on mobile */
.section.center :deep(input[type='range']) {
  width: 100%;
}
.section.center :deep(button) {
  width: var(--adminbar-control-width);
}
.slider-wrap {
  min-width: 0;
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
