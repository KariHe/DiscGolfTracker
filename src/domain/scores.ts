import type { Layout, Round } from './types.ts'

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

/** Score vs par for display: "E" when even, else "+2" / "-1". */
export function vsParLabel(vsPar: number | null): string {
  return vsPar === 0 ? 'E' : formatVsPar(vsPar)
}

export function formatVsPar(vsPar: number | null | undefined): string {
  if (vsPar === null || vsPar === undefined) return ''
  return vsPar > 0 ? `+${vsPar}` : String(vsPar)
}

export type ScoreName = 'ace' | 'eagle' | 'birdie' | 'par' | 'bogey' | 'double' | 'tripleOrWorse'

/** Name key for a hole score, e.g. "birdie" for 2 on a par 3. */
export function scoreName(strokes: number, par: number): ScoreName {
  if (strokes === 1) return 'ace'
  const diff = strokes - par
  if (diff <= -2) return 'eagle'
  if (diff === -1) return 'birdie'
  if (diff === 0) return 'par'
  if (diff === 1) return 'bogey'
  if (diff === 2) return 'double'
  return 'tripleOrWorse'
}

/** Index of the first hole some player has no score on; the last hole when all are scored. */
export function firstIncompleteHole(round: Round, layout: Layout): number {
  const ids = round.playerIds ?? []
  const index = layout.pars.findIndex((_, hole) =>
    ids.some((id) => typeof round.scores?.[id]?.[hole] !== 'number'))
  return index === -1 ? layout.pars.length - 1 : index
}
