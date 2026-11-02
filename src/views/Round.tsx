import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useStorage } from '../storage/useStorage.ts'
import { playerTotals, formatVsPar } from '../domain/scores.ts'
import type { Layout, Player, Round } from '../domain/types.ts'

export default function Round() {
  const storage = useStorage()
  const navigate = useNavigate()
  const [round, setRound] = useState<Round | null>(null)
  const roundRef = useRef<Round | null>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [searchParams] = useSearchParams()

  const reload = useCallback(async () => {
    const [allRounds, allLayouts, allPlayers] = await Promise.all([
      storage.list('rounds'),
      storage.list('layouts'),
      storage.list('players'),
    ])
    const active = allRounds.find((candidate) => !candidate.finished) ?? null
    setRound(active)
    roundRef.current = active
    setLayout(allLayouts.find((candidate) => candidate.id === active?.layoutId) ?? null)
    setPlayers(allPlayers.filter((candidate) => active?.playerIds?.includes(candidate.id)))
  }, [storage])

  useEffect(() => {
    reload()
  }, [reload])

  function paddedStrokes(strokesOfPlayer: (number | undefined)[], holeIndex: number) {
    if (strokesOfPlayer.length > holeIndex) return strokesOfPlayer
    return [
      ...strokesOfPlayer,
      ...Array(holeIndex + 1 - strokesOfPlayer.length).fill(undefined),
    ]
  }

  async function setScore(playerId: string, holeIndex: number, rawValue: string) {
    // work from the ref so rapid edits never base on a stale round state
    const current = roundRef.current
    if (!current) return
    const padded = paddedStrokes(current.scores?.[playerId] ?? [], holeIndex)
    const typed =
      rawValue === '' ? undefined : Math.max(0, Number(rawValue))
    const next = {
      ...current,
      scores: {
        ...current.scores,
        [playerId]: padded.map((previous, hole) => (hole === holeIndex ? typed : previous)),
      },
    }
    roundRef.current = next
    await storage.save('rounds', next)
    setRound(next)
  }

  async function finish() {
    const current = roundRef.current
    if (!current) return
    const finished = { ...current, finished: true }
    await storage.save('rounds', finished)
    navigate('/history')
  }

  async function deleteActive() {
    const current = roundRef.current
    if (!current) return
    if (!window.confirm('Delete active round?')) return
    await storage.delete('rounds', current.id)
    navigate('/')
  }

  if (!round || !layout) {
    return (
      <>
        <p>No active round</p>
        <Link to="/round/new">Start a round</Link>
      </>
    )
  }

  return (
    <>
      <h1>Scorekeeper</h1>
      <p>
        {layout.name} — {layout.pars.length} holes
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            {layout.pars.map((par, hole) => (
              <th key={hole}>
                {hole + 1} <small>({par})</small>
              </th>
            ))}
            <th>Total vs par</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const { total, vsPar } = playerTotals(round, player.id, layout)
            return (
              <tr key={player.id}>
                <td>{player.name}</td>
                {layout.pars.map((_, hole) => (
                  <td key={hole}>
                    <input
                      type="number"
                      min="0"
                      value={round.scores?.[player.id]?.[hole] ?? ''}
                      aria-label={`${player.name} strokes hole ${hole + 1}`}
                      onChange={(e) => setScore(player.id, hole, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  {total} ({formatVsPar(vsPar)})
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <button onClick={finish}>Finish round</button>
      <button onClick={deleteActive}>Delete active round</button>
    </>
  )
}
