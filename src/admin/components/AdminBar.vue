<template>
  <div class="admin-bar">
    <div class="section left">
      <span class="label">Actieve speler:</span>
      <span class="value">—</span>
      <button class="btn" type="button">Verander van speler</button>
    </div>

    <div class="section right">
      <button class="btn" type="button" @click="showModal = true">Reset spel…</button>
    </div>
  </div>

  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
      <h2 id="reset-title">Weet je zeker dat je wilt resetten?</h2>
      <p class="subtext">Optioneel: geef een seednummer op.</p>

      <label class="seed-label">
        <span>Seed</span>
        <input type="number" inputmode="numeric" v-model="seed" placeholder="Bijv. 42" />
      </label>

      <div class="modal-actions">
        <button class="btn" type="button" @click="closeModal">Annuleren</button>
        <button class="btn btn-danger" type="button" @click="confirmReset">Resetten</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue'

const showModal = ref(false)
const seed = ref<number | null>(null)

const emit = defineEmits<{ (e: 'reset', seed?: number): void }>()

function closeModal() {
  showModal.value = false
}

function confirmReset() {
  // Parse the seed to a number if valid; otherwise undefined
  const raw = seed.value
  const parsed = typeof raw === 'number' && !Number.isNaN(raw) ? raw : undefined
  emit('reset', parsed)
  showModal.value = false
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

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}

.modal {
  background: #fff;
  color: #222;
  width: min(520px, 100%);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  padding: 20px;
}

.modal h2 {
  margin: 0 0 6px;
  font-size: 1.2rem;
}

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

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
