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
      <div class="result-video" :class="['result-' + result.type]">
        <video
          v-if="videoSrc"
          :src="videoSrc"
          controls
          autoplay
          muted
          playsinline
          @ended="onVideoEnded"
          class="result-video-el"
          aria-label="Resultaat video"
        >
          Je browser ondersteunt de video tag niet.
        </video>
        <p v-else>Video niet beschikbaar.</p>
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
import Modal from '@/frontend/ui/Modal.vue'
import Button from '@/frontend/ui/Button.vue'
import type { RevealResult } from '@/frontend/types/api'

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

const videoSrc = computed(() => {
  switch (result.value.type) {
    case 'none':
      return '/lost.mp4'
    case 'consolation':
      return '/won-consolation.mp4'
    case 'grand':
      return '/won-grand.mp4'
    default:
      return ''
  }
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
  try {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch {}
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

function onVideoEnded() {
  onCloseResult()
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
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
}

.result-video {
  margin-top: 8px;
  padding: 8px;
  border-radius: var(--radius-md);
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
}

.result-video-el {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
  border-radius: var(--radius-sm);
}

.result-none {
  background: var(--play-lost-bg);
  border-color: var(--play-lost-border);
  color: var(--play-lost-text);
}

.result-consolation {
  background: var(--play-consolation-bg);
  border-color: var(--play-consolation-border);
  box-shadow: var(--play-consolation-shadow);
}

.result-grand {
  background: var(--play-grand-bg);
  border-color: var(--play-grand-border);
  color: var(--play-grand-text);
  box-shadow: var(--play-grand-shadow);
}
</style>
