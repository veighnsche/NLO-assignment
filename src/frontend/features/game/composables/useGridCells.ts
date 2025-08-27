import { computed } from 'vue'
import { useGridStore } from '@/frontend/features/game/store/grid'

export function useGridCells(rows = 100, cols = 100) {
  const grid = useGridStore()

  const cells = Array.from({ length: rows * cols }, (_, i) => i)
  const revealedSet = computed(() => grid.revealedSet)
  const exposedSet = computed(() => grid.exposedSet)
  const revealedById = computed(() => grid.revealedById)
  const revealing = computed(() => grid.isRevealing)
  const userHasRevealed = computed(() => grid.userHasRevealed())
  const showExposed = computed(() => grid.showExposed)

  const getRow = (i: number) => Math.floor(i / cols)
  const getCol = (i: number) => i % cols

  function cellIdFromIndex(i: number): string {
    return `r${getRow(i)}-c${getCol(i)}`
  }

  function isRevealed(i: number): boolean {
    return revealedSet.value.has(cellIdFromIndex(i))
  }

  function isExposed(i: number): boolean {
    return showExposed.value && !isRevealed(i) && exposedSet.value.has(cellIdFromIndex(i))
  }

  function cellPrize(i: number) {
    return revealedById.value.get(cellIdFromIndex(i))?.prize
  }

  function cellPrizeType(i: number): 'grand' | 'consolation' | undefined {
    return cellPrize(i)?.type as 'grand' | 'consolation' | undefined
  }

  function exposedPrizeType(i: number): 'grand' | 'consolation' | undefined {
    if (!isExposed(i)) return undefined
    const id = cellIdFromIndex(i)
    const t = grid.exposedTargets.find(
      (x: { id: string; prize?: { type?: 'grand' | 'consolation' } }) => x.id === id,
    )?.prize?.type
    return t === 'grand' || t === 'consolation' ? t : undefined
  }

  function isCellDisabled(i: number): boolean {
    return revealing.value || userHasRevealed.value || isRevealed(i)
  }

  function ariaLabelForCell(i: number): string {
    if (!isRevealed(i)) {
      return isCellDisabled(i) ? 'Gesloten vakje (niet speelbaar)' : 'Gesloten vakje (speelbaar)'
    }
    const t = cellPrizeType(i)
    if (t === 'grand') return 'Geopend vakje (Hoofdprijs)'
    if (t === 'consolation') return 'Geopend vakje (Troostprijs)'
    return 'Geopend vakje'
  }

  return {
    // constants and collections
    rows,
    cols,
    cells,
    // store and state
    grid,
    revealedSet,
    exposedSet,
    revealedById,
    revealing,
    userHasRevealed,
    showExposed,
    // helpers
    getRow,
    getCol,
    cellIdFromIndex,
    isRevealed,
    isExposed,
    cellPrize,
    cellPrizeType,
    exposedPrizeType,
    isCellDisabled,
    ariaLabelForCell,
  }
}
