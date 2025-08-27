<template>
  <Modal v-model="open" :ariaLabelledby="step === 'confirm' ? 'confirm-title' : 'result-title'">
    <!-- Step 1: Confirm -->
    <div v-if="step === 'confirm'">
      <h2 id="confirm-title">Vakje openen bevestigen</h2>
      <p class="confirm-text">
        Weet je zeker dat je vakje
        <strong>Rij {{ pending?.row }}, Kolom {{ pending?.col }}</strong>
        wilt openen?
      </p>
      <p v-if="errorMsg" class="error-text" role="alert">{{ errorMsg }}</p>
    </div>

    <!-- Step 2: Result -->
    <div v-else>
      <h2 id="result-title">Uitslag</h2>
      <div class="result-card" :class="['result-' + result.type]">
        <p v-if="result.type === 'none'">Helaas, geen prijs deze keer. Probeer het nog eens!</p>
        <p v-else-if="result.type === 'consolation'">
          Gefeliciteerd! Je hebt een <strong>Troostprijs</strong> gewonnen
          <template v-if="result.amount"
            >van <strong>{{ nfCurrency.format(result.amount) }}</strong></template
          >.
        </p>
        <p v-else-if="result.type === 'grand'">
          Fantastisch! Je hebt de <strong>Hoofdprijs</strong> gewonnen
          <template v-if="result.amount"
            >van <strong>{{ nfCurrency.format(result.amount) }}</strong></template
          >! 🎉
        </p>
      </div>
    </div>

    <!-- Footer slot -->
    <template #footer>
      <template v-if="step === 'confirm'">
        <Button @click="onCancel">Annuleren</Button>
        <Button :disabled="busy" color="danger" @click="onConfirm">
          <span v-if="!busy">Openen</span>
          <span v-else>Bezig…</span>
        </Button>
      </template>
      <template v-else>
        <Button color="primary" @click="onCloseResult">Sluiten</Button>
      </template>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Modal from '@/frontend/components/ui/Modal.vue'
import Button from '@/frontend/components/ui/Button.vue'

export type RevealResult = {
  type: 'none' | 'consolation' | 'grand'
  amount: number
}

const props = defineProps<{
  modelValue: boolean
  pending: { id: string; row: number; col: number } | null
  performReveal: (id: string) => Promise<RevealResult>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'closed'): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const step = ref<'confirm' | 'result'>('confirm')
const result = ref<RevealResult>({ type: 'none', amount: 0 })
const busy = ref(false)
const errorMsg = ref<string | null>(null)

const nfCurrency = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

watch(
  () => props.modelValue,
  (opened) => {
    if (opened) {
      // Reset step when opening
      step.value = 'confirm'
      result.value = { type: 'none', amount: 0 }
      busy.value = false
      errorMsg.value = null
    }
  },
)

function onCancel() {
  open.value = false
  emit('closed')
}

async function onConfirm() {
  if (!props.pending || busy.value) return
  busy.value = true
  errorMsg.value = null
  try {
    const r = await props.performReveal(props.pending.id)
    result.value = r
    step.value = 'result'
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Er ging iets mis. Probeer het opnieuw.'
    errorMsg.value = msg
  } finally {
    busy.value = false
  }
}

function onCloseResult() {
  open.value = false
  emit('closed')
}
</script>

<style scoped>
.confirm-text {
  margin-top: 6px;
}

.result-card {
  margin-top: 8px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--border-subtle);
}

.result-consolation {
  border-color: color-mix(in srgb, #2ecc71 35%, var(--border-subtle));
  box-shadow: 0 0 0 2px color-mix(in srgb, #2ecc71 20%, transparent);
}

.result-grand {
  border-color: color-mix(in srgb, #f39c12 45%, var(--border-subtle));
  box-shadow: 0 0 0 2px color-mix(in srgb, #f39c12 25%, transparent);
}
</style>
