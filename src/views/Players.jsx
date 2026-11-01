import { useCallback, useEffect, useState } from 'react'
import { useStorage } from '../storage/useStorage.js'
import { playerIsReferenced } from '../domain/records.js'

export default function Players() {
  const storage = useStorage()
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const reload = useCallback(async () => {
    const listed = await storage.list('players')
    setPlayers(listed.sort((a, b) => a.name.localeCompare(b.name)))
  }, [storage])

  useEffect(() => {
    reload()
  }, [reload])

  async function addPlayer(event) {
    event.preventDefault()
    if (!name.trim()) return
    await storage.save('players', { name: name.trim() })
    setName('')
    reload()
  }

  function startEdit(player) {
    setEditingId(player.id)
    setEditName(player.name)
  }

  async function saveEdit(event) {
    event.preventDefault()
    if (!editName.trim()) return
    const player = players.find((p) => p.id === editingId)
    await storage.save('players', { ...player, name: editName.trim() })
    setEditingId(null)
    reload()
  }

  async function remove(player) {
    const rounds = await storage.list('rounds')
    if (playerIsReferenced(rounds, player.id)) {
      await storage.save('players', { ...player, archived: true })
    } else {
      await storage.delete('players', player.id)
    }
    reload()
  }

  return (
    <>
      <h1>Players</h1>
      <form onSubmit={addPlayer}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add player"
          aria-label="Player name"
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            {editingId === player.id ? (
              <form onSubmit={saveEdit}>
                <input
                  value={editName}
                  aria-label="Edit player name"
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button type="submit">Save</button>
              </form>
            ) : (
              <>
                {player.name}
                {player.archived && <span> (archived)</span>}
                <button onClick={() => startEdit(player)}>Edit</button>
                <button onClick={() => remove(player)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
