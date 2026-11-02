import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useStorage } from '../storage/useStorage.ts'
import { playerTotals, formatVsPar } from '../domain/scores.ts'
import type { Course, Layout, Player, Round } from '../domain/types.ts'

function paddedStrokes(strokesOfPlayer: (number | undefined)[], holeIndex: number) {
  if (strokesOfPlayer.length > holeIndex) return strokesOfPlayer
  return [...strokesOfPlayer, ...Array(holeIndex + 1 - strokesOfPlayer.length).fill(undefined)]
}

export default function HistoryDetail() {
  const { roundId } = useParams()
  const storage = useStorage()
  const navigate = useNavigate()
  const [round, setRound] = useState<Round | null>(null)
  const roundRef = useRef<Round | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')

  const reload = useCallback(async () => {
    const [found, allPlayers] = await Promise.all([
      storage.get('rounds', roundId ?? ''),
      storage.list('players'),
    ])
    setRound(found ?? null)
    roundRef.current = found ?? null
    setPlayers(allPlayers)
    if (!found) return
    setNote(found.note ?? '')
    setDate(found.date ?? '')
    const layoutOfRound = found.layoutId
      ? await storage.get('layouts', found.layoutId)
      : null
    setLayout(layoutOfRound ?? null)
    setCourse((layoutOfRound ? await storage.get('courses', layoutOfRound.courseId) : null) ?? null)
  }, [storage, roundId])

  useEffect(() => {
    reload()
  }, [reload])

  if (!round) {
    return (
      <>
        <p>Round not found</p>
        <Link to="/history">History</Link>
      </>
    )
  }

  async function setScore(playerId: string, holeIndex: number, rawValue: string) {
    // work from the ref so rapid edits never base on a stale round state
    const current = roundRef.current
    if (!current) return
    const padded = paddedStrokes(current.scores?.[playerId] ?? [], holeIndex)
    const typed = rawValue === '' ? undefined : Math.max(0, Number(rawValue))
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

  async function saveDetails() {
    const current = roundRef.current
    if (!current) return
    const details = { ...current, date, note: note.trim() || undefined }
    roundRef.current = details
    await storage.save('rounds', details)
    reload()
  }

  async function remove() {
    if (!round) return
    if (!window.confirm('Delete round?')) return
    await storage.delete('rounds', round.id)
    navigate('/history')
  }

  const playersWithScores = Object.keys(round.scores ?? {})

  return (
    <>
      <h1>
        {course?.name} — {layout?.name}
      </h1>
      <p>{round.date}</p>
      {layout && (
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
            {playersWithScores.map((playerId) => {
              const playerName = players.find((candidate) => candidate.id === playerId)?.name
              const { total, vsPar } = playerTotals(round, playerId, layout)
              return (
                <tr key={playerId}>
                  <td>{playerName}</td>
                  {layout.pars.map((_, hole) => (
                    <td key={hole}>
                      <input
                        type="number"
                        min="0"
                        value={round.scores?.[playerId]?.[hole] ?? ''}
                        aria-label={`${playerName} strokes hole ${hole + 1}`}
                        onChange={(e) => setScore(playerId, hole, e.target.value)}
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
      )}
      <label>
        Date <input type="date" aria-label="Round date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label>
        Note{' '}
        <input
          aria-label="Round note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <button onClick={saveDetails}>Save details</button>
      <button onClick={remove}>Delete round</button>
      <Link to="/history">Back</Link>
    </>
  )
}
