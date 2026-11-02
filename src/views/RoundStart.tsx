import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { useStorage } from '../storage/useStorage.ts'
import type { Course, Layout, Player } from '../domain/types.ts'

export default function RoundStart() {
  const storage = useStorage()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [courseId, setCourseId] = useState('')
  const [layoutId, setLayoutId] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  const reload = useCallback(async () => {
    const [allCourses, allLayouts, allPlayers, allRounds] = await Promise.all([
      storage.list('courses'),
      storage.list('layouts'),
      storage.list('players'),
      storage.list('rounds'),
    ])
    // pickers hide archived records
    setCourses(allCourses.filter((c) => !c.archived))
    setLayouts(allLayouts.filter((l) => !l.archived))
    setPlayers(allPlayers.filter((p) => !p.archived))
    // one Active Round only: the picker page is pointless while one runs
    if (allRounds.some((round) => !round.finished)) navigate('/round', { replace: true })
  }, [storage, navigate])

  useEffect(() => {
    reload()
  }, [reload])

  const courseLayouts = layouts.filter((layout) => layout.courseId === courseId)

  async function start(event: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    await storage.save('rounds', {
      date,
      finished: false,
      note: note.trim() || undefined,
      layoutId,
      playerIds: picked,
      scores: Object.fromEntries(picked.map((playerId) => [playerId, []])),
    })
    navigate('/round')
  }

  function togglePlayer(playerId: string) {
    setPicked((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId],
    )
  }

  return (
    <>
      <h1>Start a round</h1>
      <div>
        <h2>Course</h2>
        <ul>
          {courses.length === 0 && <li>No courses yet — add one first</li>}
          {courses.map((course) => (
            <li key={course.id}>
              <button onClick={() => { setCourseId(course.id); setLayoutId('') }}>
                {course.name}
                {courseId === course.id && <> (picked)</>}
              </button>
            </li>
          ))}
        </ul>
        <h2>Layout</h2>
        <ul>
          {courseId && courseLayouts.length === 0 && <li>No layouts on this course</li>}
          {courseLayouts.map((layout) => (
            <li key={layout.id}>
              <button onClick={() => setLayoutId(layout.id)}>
                {layout.name} — {layout.pars.length} holes
                {layoutId === layout.id && <> (picked)</>}
              </button>
            </li>
          ))}
        </ul>
        <h2>Players</h2>
        <ul>
          {players.length === 0 && <li>No players yet — add some first</li>}
          {players.map((player) => (
            <li key={player.id}>
              <label>
                <input
                  type="checkbox"
                  checked={picked.includes(player.id)}
                  onChange={() => togglePlayer(player.id)}
                />{' '}
                {player.name}
              </label>
            </li>
          ))}
        </ul>
        <label>
          Date{' '}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Note{' '}
          <input
            aria-label="Round note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>
      <button disabled={!layoutId || picked.length === 0} onClick={start}>
        Start round
      </button>
    </>
  )
}
