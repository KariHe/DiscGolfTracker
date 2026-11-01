import { Link } from 'react-router'
import { useStorage } from '../storage/useStorage.js'
import { useEffect, useState } from 'react'

export default function Home() {
  const storage = useStorage()
  const [activeRound, setActiveRound] = useState(null)

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
