import { computed, ref } from 'vue'
import { nfCurrency } from '@/frontend/lib/format'
import type { PrizeType, Prize } from '@/frontend/types/api'

export interface TooltipPayload {
  text: string
  x: number
  y: number
  opener: string | null
  revealed: boolean
  prizeType?: PrizeType
  prizeAmount?: Prize['amount']
  revealedAt?: string | null
}

export interface GridTooltipApi {
  hover(payload: TooltipPayload): void
  move(x: number, y: number): void
  leave(): void
}

const dfDateTime = new Intl.DateTimeFormat('nl-NL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function useGridTooltip() {
  // Core state
  const open = ref(false)
  const x = ref(0)
  const y = ref(0)
  const text = ref('')
  const opener = ref<string | null>(null)
  const revealed = ref(false)
  const prizeType = ref<PrizeType | undefined>(undefined)
  const prizeAmount = ref<Prize['amount'] | undefined>(undefined)
  const revealedAt = ref<string | null>(null)

  // Derived values
  const prizeLabel = computed(() => {
    if (prizeType.value === 'grand') return 'Hoofdprijs'
    if (prizeType.value === 'consolation') return 'Troostprijs'
    if (prizeType.value === 'none') return 'Geen prijs'
    return 'Onbekend'
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

  const whenText = computed(() => (revealedAt.value ? dfDateTime.format(new Date(revealedAt.value)) : null))

  // Handlers
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

  function onMove(nx: number, ny: number) {
    if (!open.value) return
    x.value = nx
    y.value = ny
  }

  return {
    // state
    open,
    x,
    y,
    text,
    opener,
    revealed,
    prizeType,
    prizeAmount,
    revealedAt,
    // derived
    prizeLabel,
    prizeAmountText,
    prizeClass,
    statusClass,
    whenText,
    // handlers
    onHover,
    onLeave,
    onMove,
  }
}
