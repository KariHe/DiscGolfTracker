import type { Round } from './types.ts'

export function playerIsReferenced(rounds: Round[], playerId: string): boolean {
  return rounds.some((round) => round.playerIds?.includes(playerId))
}

export function layoutIsReferenced(rounds: Round[], layoutId: string): boolean {
  return rounds.some((round) => round.layoutId === layoutId)
}

export function courseIsReferenced(
  layouts: { id: string; courseId: string }[],
  rounds: Round[],
  courseId: string,
): boolean {
  const courseLayoutIds = layouts
    .filter((layout) => layout.courseId === courseId)
    .map((layout) => layout.id)
  return (
    courseLayoutIds.length > 0 ||
    rounds.some((round) => courseLayoutIds.includes(round.layoutId as string))
  )
}
