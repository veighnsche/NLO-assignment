import { defineStore } from 'pinia'
import { ref } from 'vue'
import { nanoid } from 'nanoid'

export type ToastType = 'info' | 'success' | 'error'
export interface ToastItem {
  id: string
  type: ToastType
  message: string
}

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([])

  function remove(id: string) {
    items.value = items.value.filter((t) => t.id !== id)
  }

  function push(type: ToastType, message: string, opts?: { timeoutMs?: number }) {
    const id = nanoid()
    items.value.push({ id, type, message })
    const timeout = opts?.timeoutMs ?? 3000
    if (timeout > 0) {
      window.setTimeout(() => remove(id), timeout)
    }
    return id
  }

  function info(message: string, opts?: { timeoutMs?: number }) {
    return push('info', message, opts)
  }
  function success(message: string, opts?: { timeoutMs?: number }) {
    return push('success', message, opts)
  }
  function error(message: string, opts?: { timeoutMs?: number }) {
    return push('error', message, opts)
  }

  return { items, push, remove, info, success, error }
})
