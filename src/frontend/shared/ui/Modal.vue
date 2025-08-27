<template>
  <teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="onOverlayClick">
      <div
        ref="dialogRef"
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="ariaLabelledby || undefined"
        :aria-describedby="ariaDescribedby || undefined"
        @keydown.esc.prevent.stop="requestClose"
        @keydown.tab.prevent="onTabKey"
      >
        <slot />
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
// Ensure multi-word component name for linting compliance
defineOptions({ name: 'UiModal' })

const props = defineProps<{
  modelValue: boolean
  closeOnOverlay?: boolean
  ariaLabelledby?: string | null
  ariaDescribedby?: string | null
  preventScroll?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'close'): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
const previouslyFocused = ref<HTMLElement | null>(null)

const requestClose = () => {
  emit('update:modelValue', false)
}

const onOverlayClick = () => {
  if (props.closeOnOverlay !== false) requestClose()
}

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  const selectors = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex="-1"])',
  ]
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(selectors.join(',')))
  return nodes.filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))
}

const onTabKey = (e: KeyboardEvent) => {
  const container = dialogRef.value
  if (!container) return
  const focusables = getFocusable(container)
  if (focusables.length === 0) return
  const current = document.activeElement as HTMLElement | null
  const idx = current ? focusables.indexOf(current) : -1
  const dir = e.shiftKey ? -1 : 1
  let nextIdx = idx + dir
  if (nextIdx < 0) nextIdx = focusables.length - 1
  if (nextIdx >= focusables.length) nextIdx = 0
  focusables[nextIdx].focus()
}

function lockScroll(lock: boolean) {
  if (!props.preventScroll && props.preventScroll !== undefined) return
  const body = document.body
  if (lock) {
    if (!body.style.overflow) body.dataset.prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'
  } else {
    body.style.overflow = body.dataset.prevOverflow || ''
    delete body.dataset.prevOverflow
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      emit('open')
      previouslyFocused.value = document.activeElement as HTMLElement | null
      lockScroll(true)
      await nextTick()
      // Focus first focusable or dialog itself
      const focusables = getFocusable(dialogRef.value)
      if (focusables.length > 0) focusables[0].focus()
      else dialogRef.value?.focus()
    } else {
      lockScroll(false)
      emit('close')
      previouslyFocused.value?.focus?.()
    }
  },
  { immediate: false },
)

onMounted(() => {
  if (props.modelValue) {
    emit('open')
    lockScroll(true)
  }
})

onBeforeUnmount(() => {
  if (props.modelValue) lockScroll(false)
})
</script>

<style scoped>
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
  outline: none;
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
