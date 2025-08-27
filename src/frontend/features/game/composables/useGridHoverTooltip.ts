import { ref, type Ref } from 'vue'
import type { GridTooltipApi } from '@/frontend/features/game/composables/useGridTooltip'
import type { Cell } from '@/frontend/types/api'

export type UseGridHoverArgs = {
  tooltip: GridTooltipApi | null
  getRow: (i: number) => number
  getCol: (i: number) => number
  cellIdFromIndex: (i: number) => string
  revealedById: Ref<Map<string, Cell>>
  userNameById: (id?: string | null) => string | null
}

export function useGridHoverTooltip({
  tooltip,
  getRow,
  getCol,
  cellIdFromIndex,
  revealedById,
  userNameById,
}: UseGridHoverArgs) {
  const rafId = ref<number | null>(null)
  const lastIdx = ref<number | null>(null)

  function schedule(fn: () => void) {
    if (rafId.value != null) return
    rafId.value = requestAnimationFrame(() => {
      rafId.value = null
      fn()
    })
  }

  function onGridMove(e: MouseEvent) {
    schedule(() => {
      const target = (e.target as HTMLElement).closest('button.cell') as HTMLElement | null
      if (!target) {
        tooltip?.leave()
        lastIdx.value = null
        return
      }
      const idxAttr = target.getAttribute('data-index')
      if (idxAttr == null) {
        tooltip?.leave()
        lastIdx.value = null
        return
      }
      const idx = Number(idxAttr)
      if (Number.isNaN(idx)) {
        tooltip?.leave()
        lastIdx.value = null
        return
      }
      if (lastIdx.value === idx) {
        tooltip?.move(e.clientX, e.clientY)
        return
      }
      lastIdx.value = idx
      const text = `Rij ${getRow(idx)}, Kolom ${getCol(idx)}`
      const id = cellIdFromIndex(idx)
      const cell = revealedById.value.get(id)
      const openerName = userNameById(cell?.revealedBy) || cell?.revealedBy || null
      tooltip?.hover({
        text,
        x: e.clientX,
        y: e.clientY,
        opener: openerName,
        revealed: !!cell?.revealed,
        prizeType: cell?.prize?.type,
        prizeAmount: cell?.prize?.amount,
        revealedAt: cell?.revealedAt ?? null,
      })
    })
  }

  function onGridLeave() {
    tooltip?.leave()
    lastIdx.value = null
  }

  return { onGridMove, onGridLeave }
}
