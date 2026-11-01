/**
 * Reference checks backing the archive-vs-delete rule:
 * a record referenced by at least one Round (or, for a Course, having any
 * Layout plus history) may only be archived, not deleted.
 * Round shape (shared): { layoutId, playerIds, scores: { <playerId>: [...strokes] }, ... }
 */
export function playerIsReferenced(rounds, playerId) {
  return rounds.some((round) => round.playerIds?.includes(playerId))
}

export function layoutIsReferenced(rounds, layoutId) {
  return rounds.some((round) => round.layoutId === layoutId)
}

export function courseIsReferenced(layouts, rounds, courseId) {
  const courseLayoutIds = layouts
    .filter((layout) => layout.courseId === courseId)
    .map((layout) => layout.id)
  return (
    courseLayoutIds.length > 0 ||
    rounds.some((round) => courseLayoutIds.includes(round.layoutId))
  )
}
