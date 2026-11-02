import { Link } from 'react-router'
import { useStorage } from '../storage/useStorage.ts'
import { useEffect, useState } from 'react'
import type { Round } from '../domain/types.ts'

export default function Home() {
  const storage = useStorage()
  const [activeRound, setActiveRound] = useState<Round | null>(null)

  useEffect(() => {
    storage.list('rounds').then((rounds) => {
      setActiveRound(rounds.find((round) => !round.finished) ?? null)
    })
  }, [storage])

  return (
    <>
      <h1>Home</h1>
      {activeRound ? (
        <p>
          Active round in progress — <Link to="/round">Resume</Link>
        </p>
      ) : (
        <p>
          <Link to="/round/new">Start a round</Link>
        </p>
      )}
      <p>
        <Link to="/history">History</Link>
      </p>
    </>
  )
}
