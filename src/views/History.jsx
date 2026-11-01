import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useStorage } from '../storage/useStorage.js'
import { playerTotals, formatVsPar } from '../domain/scores.js'

export default function History() {
  const storage = useStorage()
  const [rounds, setRounds] = useState([])
  const [layouts, setLayouts] = useState([])
  const [players, setPlayers] = useState([])

  const reload = useCallback(async () => {
    const [allRounds, allLayouts, allPlayers] = await Promise.all([
      storage.list('rounds'),
      storage.list('layouts'),
      storage.list('players'),
    ])
    setRounds(allRounds.filter((round) => round.finished))
    setLayouts(allLayouts)
    setPlayers(allPlayers)
  }, [storage])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <>
      <h1>History</h1>
      {rounds.length === 0 && <p>No finished rounds yet</p>}
      <ul>
        {rounds.map((round) => (
          <li key={round.id}>
            <Link to={`/history/${round.id}`}>{round.date}</Link> —{' '}
            {layouts.find((l) => l.id === round.layoutId)?.name}
            <ul>
              {round.playerIds?.map((playerId) => {
                const player = players.find((candidate) => candidate.id === playerId)
                if (!player) return null
                const layout = layouts.find((l) => l.id === round.layoutId)
                const { total, vsPar } = playerTotals(round, player.id, layout)
                const formatted = formatVsPar(vsPar)
                return (
                  <li key={playerId}>
                    {player.name}: {total}
                    {formatted && ` (${formatted})`}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </>
  )
}
