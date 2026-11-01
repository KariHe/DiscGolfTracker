/**
 * Score computations shared by the Scorekeeper table and the History.
 * Per-hole strokes may be blank (undefined) until entered; blanks count as nothing.
 */
export function playerStrokes(round, playerId) {
  const strokes = round.scores?.[playerId] ?? []
  return strokes.filter((strokesOnHole) => typeof strokesOnHole === 'number')
}

/** Totals compared against the layout par, aligned by hole. Blank holes use their par. */
export function playerTotals(round, playerId, layout) {
  const strokes = round.scores?.[playerId] ?? []
  const total = strokes.reduce((sum, strokesOnHole) =>
    typeof strokesOnHole === 'number' ? sum + strokesOnHole : sum, 0)
  const vsPar = layout
    ? strokes.reduce((sum, strokesOnHole, hole) =>
        typeof strokesOnHole === 'number' ? sum + strokesOnHole - layout.pars[hole] : sum, 0)
    : null
  return { total, vsPar }
}

export function formatVsPar(vsPar) {
  if (vsPar === null || vsPar === undefined) return ''
  return vsPar > 0 ? `+${vsPar}` : String(vsPar)
}
