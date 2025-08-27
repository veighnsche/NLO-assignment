import { ref, computed } from 'vue'

export type PrizeType = 'none' | 'consolation' | 'grand' | undefined
export type PrizeAmount = 0 | 100 | 25000 | undefined

export interface TooltipPayload {
  text: string
  x: number
  y: number
  opener: string | null
  revealed: boolean
  prizeType?: 'none' | 'consolation' | 'grand'
  prizeAmount?: 0 | 100 | 25000
  revealedAt?: string | null
}

// Hoisted formatters to avoid per-instance allocations
const nfCurrency = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const dfDateTime = new Intl.DateTimeFormat('nl-NL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function useTooltip() {
  // Core state
  const open = ref(false)
  const x = ref(0)
  const y = ref(0)
  const text = ref('')
  const opener = ref<string | null>(null)
  const revealed = ref(false)
  const prizeType = ref<PrizeType>(undefined)
  const prizeAmount = ref<PrizeAmount>(undefined)
  const revealedAt = ref<string | null>(null)

  // Localization helpers (hoisted above)

  // Derived display values
  const prizeLabel = computed(() => {
    if (prizeType.value === 'grand') return 'Hoofdprijs'
    if (prizeType.value === 'consolation') return 'Troostprijs'
    if (prizeType.value === 'none') return 'Geen prijs'
    return 'Onbekend'
  })

  const prizeEmoji = computed(() => {
    if (prizeType.value === 'grand') return '💎'
    if (prizeType.value === 'consolation') return '🎁'
    return '—'
  })

  const prizeAmountText = computed(() =>
    prizeAmount.value != null ? nfCurrency.format(prizeAmount.value) : '',
  )

  const prizeClass = computed(() => {
    return prizeType.value === 'grand'
      ? 'prize--grand'
      : prizeType.value === 'consolation'
        ? 'prize--consolation'
        : 'prize--none'
  })

  const statusClass = computed(() => (revealed.value ? 'status--open' : 'status--closed'))

  const whenText = computed(() =>
    revealedAt.value ? dfDateTime.format(new Date(revealedAt.value)) : null,
  )

  // Event handlers
  function onHover(payload: TooltipPayload) {
    text.value = payload.text
    x.value = payload.x
    y.value = payload.y
    opener.value = payload.opener ?? null
    revealed.value = payload.revealed
    prizeType.value = payload.prizeType
    prizeAmount.value = payload.prizeAmount
    revealedAt.value = payload.revealedAt ?? null
    open.value = true
  }

  function onLeave() {
    open.value = false
  }

  // Lightweight position-only update to reduce reactive churn on mousemove
  function onMove(nx: number, ny: number) {
    if (!open.value) return
    x.value = nx
    y.value = ny
  }

  return {
    // State
    open,
    x,
    y,
    text,
    opener,
    revealed,
    prizeType,
    prizeAmount,
    revealedAt,
    // Derived
    prizeLabel,
    prizeEmoji,
    prizeAmountText,
    prizeClass,
    statusClass,
    whenText,
    // Handlers
    onHover,
    onMove,
    onLeave,
  }
}
