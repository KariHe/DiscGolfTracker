import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import OutlinedInput from '@mui/material/OutlinedInput'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { useStorage } from '../storage/useStorage.ts'
import type { Course, Layout, Player } from '../domain/types.ts'
import { playerTint } from '../theme'
import { Icon } from '../components/Icon.tsx'
import { icon } from '../components/icons.tsx'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="overline" component="h2" color="text.secondary" sx={{ mb: 0.25 }}>
      {children}
    </Typography>
  )
}

export default function RoundStart() {
  const storage = useStorage()
  const navigate = useNavigate()
  const theme = useTheme()
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

  const lime = theme.palette.primary.main
  const startLabel = picked.length === 1 ? 'Start round · 1 player' : `Start round · ${picked.length} players`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 2rem)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 0.5, pb: 1 }}>
        <IconButton component={RouterLink} to="/" aria-label="Back">
          <Icon>{icon.back}</Icon>
        </IconButton>
        <Typography variant="h6" component="h1">Start a round</Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <SectionLabel>Course</SectionLabel>
          {courses.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No courses yet — <Link component={RouterLink} to="/courses">add one first</Link>
            </Typography>
          )}
          {courses.map((course) => {
            const on = courseId === course.id
            return (
              <ButtonBase
                key={course.id}
                aria-pressed={on}
                onClick={() => { setCourseId(course.id); setLayoutId('') }}
                sx={{
                  height: 60, px: 2, gap: 1.5, justifyContent: 'flex-start', textAlign: 'left',
                  borderRadius: `${theme.radius.md}px`, border: 2,
                  borderColor: on ? 'primary.main' : 'surface.raised',
                  bgcolor: on ? alpha(lime, 0.08) : 'surface.raised',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" component="span" noWrap sx={{ display: 'block' }}>{course.name}</Typography>
                  {course.location && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                      {course.location}
                    </Typography>
                  )}
                </Box>
                <Box aria-hidden="true" sx={{
                  width: 22, height: 22, borderRadius: '50%', boxSizing: 'border-box', border: 2,
                  borderColor: on ? 'primary.main' : 'surface.outline',
                  bgcolor: on ? 'primary.main' : 'transparent',
                }} />
              </ButtonBase>
            )
          })}
        </Box>

        {courseId && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <SectionLabel>Layout</SectionLabel>
            {courseLayouts.length === 0 && (
              <Typography variant="body2" color="text.secondary">No layouts on this course</Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {courseLayouts.map((layout) => {
                const on = layoutId === layout.id
                return (
                  <ButtonBase
                    key={layout.id}
                    aria-pressed={on}
                    onClick={() => setLayoutId(layout.id)}
                    sx={{
                      height: 44, px: 2, borderRadius: 999, fontSize: 14, fontWeight: 700,
                      bgcolor: on ? 'primary.main' : 'surface.elevated',
                      color: on ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    {layout.name} · par {layout.pars.reduce((sum, par) => sum + par, 0)}
                  </ButtonBase>
                )
              })}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <SectionLabel>Players</SectionLabel>
          {players.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No players yet — <Link component={RouterLink} to="/players">add some first</Link>
            </Typography>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1 }}>
            {players.map((player, index) => {
              const on = picked.includes(player.id)
              return (
                <ButtonBase
                  key={player.id}
                  aria-pressed={on}
                  onClick={() => togglePlayer(player.id)}
                  sx={{
                    position: 'relative', flexDirection: 'column', gap: 0.75, pt: 1.5, pb: 1.25,
                    borderRadius: '20px', border: 2, bgcolor: 'surface.raised',
                    borderColor: on ? 'primary.main' : 'surface.raised',
                    opacity: on ? 1 : 0.7,
                  }}
                >
                  <Avatar aria-hidden="true" sx={{ bgcolor: playerTint(theme, index) }}>{player.name[0]}</Avatar>
                  <Typography variant="subtitle2" component="span" noWrap sx={{ fontWeight: 700, maxWidth: '100%', px: 0.5 }}>
                    {player.name}
                  </Typography>
                  {on && (
                    <Box aria-hidden="true" sx={{
                      position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%',
                      bgcolor: 'primary.main', color: 'primary.contrastText',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
                    </Box>
                  )}
                </ButtonBase>
              )
            })}
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
          <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="overline" component="span" color="text.secondary">Date</Typography>
            <OutlinedInput type="date" value={date} onChange={(e) => setDate(e.target.value)} sx={{ height: 52 }} />
          </Box>
          <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="overline" component="span" color="text.secondary">Note</Typography>
            <OutlinedInput
              placeholder="Optional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              inputProps={{ 'aria-label': 'Round note' }}
              sx={{ height: 52 }}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.default', pt: 1.5, pb: 1.5 }}>
        <Button
          size="large"
          fullWidth
          disabled={!layoutId || picked.length === 0}
          onClick={start}
          endIcon={<Icon>{icon.arrow}</Icon>}
        >
          {startLabel}
        </Button>
      </Box>
    </Box>
  )
}
