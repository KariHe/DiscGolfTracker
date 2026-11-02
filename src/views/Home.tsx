import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Card from '@mui/material/Card'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { useStorage } from '../storage/useStorage.ts'
import { firstIncompleteHole, formatVsPar, playerTotals } from '../domain/scores.ts'
import type { Course, Layout, Player, Round } from '../domain/types.ts'
import { playerTint, scoreColor } from '../theme'
import { Icon } from '../components/Icon.tsx'
import { icon } from '../components/icons.tsx'

const RECENT_COUNT = 2

function vsParLabel(vsPar: number | null) {
  return vsPar === 0 ? 'E' : formatVsPar(vsPar)
}

function dateParts(date?: string) {
  if (!date) return { month: '', day: '–' }
  const parsed = new Date(`${date}T00:00`)
  return {
    month: parsed.toLocaleDateString('en', { month: 'short' }).toUpperCase(),
    day: String(parsed.getDate()),
  }
}

export default function Home() {
  const storage = useStorage()
  const theme = useTheme()
  const [rounds, setRounds] = useState<Round[]>([])
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    Promise.all([
      storage.list('rounds'),
      storage.list('layouts'),
      storage.list('players'),
      storage.list('courses'),
    ]).then(([allRounds, allLayouts, allPlayers, allCourses]) => {
      setRounds(allRounds)
      setLayouts(allLayouts)
      setPlayers(allPlayers)
      setCourses(allCourses)
    })
  }, [storage])

  const layoutOf = (round: Round) => layouts.find((l) => l.id === round.layoutId) ?? null
  const courseOf = (layout: Layout | null) => courses.find((c) => c.id === layout?.courseId)
  const playersOf = (round: Round) => players.filter((p) => round.playerIds?.includes(p.id))

  const active = rounds.find((round) => !round.finished) ?? null
  const recent = rounds
    .filter((round) => round.finished)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, RECENT_COUNT)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1.5, pb: 2 }}>
      <div>
        <Typography variant="overline" color="text.secondary">Disc Golf Tracker</Typography>
        <Typography variant="h1" sx={{ fontSize: 34, mt: 0.5 }}>Let’s play</Typography>
      </div>

      {active ? <ActiveRoundCard round={active} layout={layoutOf(active)}
        courseName={courseOf(layoutOf(active))?.name} players={playersOf(active)} /> : (
        <Card sx={{ p: 2.5, pt: 3, borderRadius: `${theme.radius.lg}px`, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div>
            <Typography variant="overline" color="primary">No round in progress</Typography>
            <Typography sx={{ mt: 0.75, fontSize: 26, fontWeight: 800 }}>Head out to the course</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.25 }}>
              Pick a course, layout and players to start scoring.
            </Typography>
          </div>
          <Button size="large" component={RouterLink} to="/round/new" startIcon={<Icon>{icon.plus}</Icon>}>
            Start a round
          </Button>
        </Card>
      )}

      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 1 }}>
        <Typography variant="h4" component="h2">Recent rounds</Typography>
        <Link component={RouterLink} to="/history" underline="none" variant="subtitle2" sx={{ fontWeight: 700, py: 1 }}>
          See all
        </Link>
      </Box>

      {recent.length === 0 && (
        <Typography variant="body2" color="text.secondary">No finished rounds yet</Typography>
      )}
      {recent.map((round) => {
        const layout = layoutOf(round)
        const roundPlayers = playersOf(round)
        const leader = roundPlayers
          .map((player) => ({ player, ...playerTotals(round, player.id, layout) }))
          .sort((a, b) => a.total - b.total)[0]
        const { month, day } = dateParts(round.date)
        return (
          <Card key={round.id}>
            <ButtonBase
              component={RouterLink}
              to={`/history/${round.id}`}
              sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, p: '14px 14px 14px 16px', textAlign: 'left' }}
            >
              <Box sx={{ width: 48, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{month}</Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{day}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" component="span" noWrap sx={{ display: 'block' }}>
                  {courseOf(layout)?.name ?? layout?.name}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" noWrap>
                  {layout?.name} · {roundPlayers.length} {roundPlayers.length === 1 ? 'player' : 'players'}
                </Typography>
              </Box>
              {leader && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: scoreColor(theme, leader.vsPar ?? 0) }}>
                    {vsParLabel(leader.vsPar)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {leader.player.name} · {leader.total}
                  </Typography>
                </Box>
              )}
            </ButtonBase>
          </Card>
        )
      })}
    </Box>
  )
}

function ActiveRoundCard({ round, layout, courseName, players }: {
  round: Round
  layout: Layout | null
  courseName?: string
  players: Player[]
}) {
  const theme = useTheme()
  const hole = layout ? firstIncompleteHole(round, layout) : 0
  const holeCount = layout?.pars.length ?? 0
  return (
    <Card sx={{ p: 2.5, borderRadius: `${theme.radius.lg}px`, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <div>
        <Typography variant="overline" color="primary">Round in progress</Typography>
        <Typography sx={{ mt: 0.75, fontSize: 26, fontWeight: 800 }}>{courseName ?? layout?.name}</Typography>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.25 }}>
          {layout?.name} · {players.length} {players.length === 1 ? 'player' : 'players'} · Hole {hole + 1} of {holeCount}
        </Typography>
      </div>
      <Box role="img" aria-label={`${hole} of ${holeCount} holes complete`}
        sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end', height: 12 }}>
        {layout?.pars.map((_, index) => (
          <Box key={index} sx={{
            flex: 1,
            borderRadius: '3px',
            height: index === hole ? 12 : 6,
            bgcolor: index === hole ? 'text.primary' : index < hole ? 'primary.main' : 'surface.track',
          }} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {players.map((player, index) => {
          const { vsPar } = playerTotals(round, player.id, layout)
          return (
            <Box key={player.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, p: '6px 10px 6px 6px', borderRadius: 999, bgcolor: 'surface.elevated' }}>
              <Avatar aria-hidden="true" sx={{ width: 22, height: 22, fontSize: 11, bgcolor: playerTint(theme, index) }}>{player.name[0]}</Avatar>
              <Typography variant="numeric" sx={{ color: scoreColor(theme, vsPar ?? 0) }}>
                <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>{player.name} </Box>
                {vsParLabel(vsPar)}
              </Typography>
            </Box>
          )
        })}
      </Box>
      <Button size="large" component={RouterLink} to="/round" endIcon={<Icon>{icon.arrow}</Icon>}>
        Resume round
      </Button>
    </Card>
  )
}
