import type { Layout } from './types.ts'

/**
 * Score computations shared by the Scorekeeper table and the History.
 * Per-hole strokes may be blank (undefined) until entered; blanks count as nothing.
 */
export function playerStrokes(
  round: { scores?: Record<string, (number | undefined)[]> },
  playerId: string,
): number[] {
  const strokes = round.scores?.[playerId] ?? []
  return strokes.filter((strokesOnHole): strokesOnHole is number => typeof strokesOnHole === 'number')
}

/** Totals compared against the layout par, aligned by hole. Blank holes use their par. */
export function playerTotals(
  round: { scores?: Record<string, (number | undefined)[]> },
  playerId: string,
  layout: Layout | null,
): { total: number; vsPar: number | null } {
  const strokes = round.scores?.[playerId] ?? []
  const total = strokes.reduce<number>((sum, strokesOnHole) =>
    typeof strokesOnHole === 'number' ? sum + strokesOnHole : sum, 0)
  const vsPar = layout
    ? strokes.reduce<number>((sum, strokesOnHole, hole) =>
        typeof strokesOnHole === 'number' ? sum + strokesOnHole - (layout.pars[hole] ?? 0) : sum, 0)
    : null
  return { total, vsPar }
}

export function formatVsPar(vsPar: number | null | undefined): string {
  if (vsPar === null || vsPar === undefined) return ''
  return vsPar > 0 ? `+${vsPar}` : String(vsPar)
}
