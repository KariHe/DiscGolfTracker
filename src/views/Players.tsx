import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import OutlinedInput from '@mui/material/OutlinedInput'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { useStorage } from '../storage/useStorage.ts'
import { playerIsReferenced } from '../domain/records.ts'
import type { Player, Round } from '../domain/types.ts'
import { playerTint } from '../theme'
import { Icon } from '../components/Icon.tsx'
import { icon } from '../components/icons.tsx'

const smallIconButton = { bgcolor: 'surface.elevated', '&:hover': { bgcolor: 'surface.track' } } as const

export default function Players() {
  const storage = useStorage()
  const theme = useTheme()
  const [players, setPlayers] = useState<Player[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const reload = useCallback(async () => {
    const [listed, allRounds] = await Promise.all([storage.list('players'), storage.list('rounds')])
    setPlayers(listed.sort((a, b) => a.name.localeCompare(b.name)))
    setRounds(allRounds)
  }, [storage])

  useEffect(() => {
    reload()
  }, [reload])

  async function addPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    await storage.save('players', { name: name.trim() })
    setName('')
    reload()
  }

  function startEdit(player: Player) {
    setEditingId(player.id)
    setEditName(player.name)
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editName.trim()) return
    const player = players.find((p) => p.id === editingId)
    if (!player) return
    await storage.save('players', { ...player, name: editName.trim() })
    setEditingId(null)
    reload()
  }

  async function remove(player: Player) {
    if (playerIsReferenced(rounds, player.id)) {
      await storage.save('players', { ...player, archived: true })
    } else {
      await storage.delete('players', player.id)
    }
    reload()
  }

  const active = players.filter((player) => !player.archived)
  const archived = players.filter((player) => player.archived)
  const roundCount = (player: Player) => rounds.filter((round) => round.playerIds?.includes(player.id)).length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1.5, pb: 2 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          {active.length} {active.length === 1 ? 'player' : 'players'}
        </Typography>
        <Typography variant="h1" sx={{ fontSize: 34, mt: 0.5 }}>Players</Typography>
      </Box>

      <Box component="form" onSubmit={addPlayer} sx={{ display: 'flex', gap: 1 }}>
        <OutlinedInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a player"
          inputProps={{ 'aria-label': 'Player name' }}
          sx={{ flex: 1, height: 56 }}
        />
        <IconButton type="submit" aria-label="Add player" sx={{
          width: 56, height: 56, bgcolor: 'primary.main', color: 'primary.contrastText',
          '&:hover': { bgcolor: 'primary.light' },
        }}>
          <Icon size={24}>{icon.plus}</Icon>
        </IconButton>
      </Box>

      {active.map((player, index) => (
        <Card key={player.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 76, pl: 1.75, pr: 1.25 }}>
          <Avatar aria-hidden="true" sx={{ bgcolor: playerTint(theme, index) }}>{player.name[0]}</Avatar>
          {editingId === player.id ? (
            <Box component="form" onSubmit={saveEdit} sx={{ flex: 1, minWidth: 0, display: 'flex', gap: 1 }}>
              <OutlinedInput
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                inputProps={{ 'aria-label': 'Edit player name' }}
                sx={{ flex: 1, minWidth: 0, height: 48, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' } }}
              />
              <Button type="submit" size="small" sx={{ height: 48 }}>Save</Button>
            </Box>
          ) : (
            <>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h5" noWrap>{player.name}</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {roundCount(player)} {roundCount(player) === 1 ? 'round' : 'rounds'}
                </Typography>
              </Box>
              <IconButton aria-label={`Edit ${player.name}`} onClick={() => startEdit(player)} sx={smallIconButton}>
                <Icon size={18}>{icon.edit}</Icon>
              </IconButton>
              <IconButton aria-label={`Delete ${player.name}`} onClick={() => remove(player)}
                sx={{ ...smallIconButton, color: 'warning.main' }}>
                <Icon size={18}>{icon.trash}</Icon>
              </IconButton>
            </>
          )}
        </Card>
      ))}

      {archived.map((player) => (
        <Box key={player.id} sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 68, px: 1.75,
          borderRadius: `${theme.radius.card}px`, border: 2, borderStyle: 'dashed', borderColor: 'surface.handle',
        }}>
          <Avatar aria-hidden="true" sx={{ width: 40, height: 40, fontSize: 16, bgcolor: 'surface.track', color: 'text.secondary' }}>
            {player.name[0]}
          </Avatar>
          <Typography variant="subtitle1" color="text.secondary" noWrap sx={{ flex: 1, fontWeight: 700 }}>{player.name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: 'surface.elevated', fontWeight: 700 }}>
            Archived
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
