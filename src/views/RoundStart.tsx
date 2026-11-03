import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import ButtonBase from '@mui/material/ButtonBase'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import OutlinedInput from '@mui/material/OutlinedInput'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { useStorage } from '../storage/useStorage.ts'
import type { Course, Layout, Player } from '../domain/types.ts'
import { playerTint } from '../theme'
import { useI18n } from '../i18n/useI18n.ts'
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
  const { t } = useI18n()
  const [courses, setCourses] = useState<Course[]>([])
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [courseId, setCourseId] = useState('')
  const [layoutId, setLayoutId] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [courseOpen, setCourseOpen] = useState(false)
  const [courseQuery, setCourseQuery] = useState('')
  const [newPlayer, setNewPlayer] = useState('')

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

  function pickCourse(id: string) {
    if (id !== courseId) { setCourseId(id); setLayoutId('') }
    setCourseOpen(false)
  }

  async function addPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newPlayer.trim()
    if (!name) return
    const saved = await storage.save('players', { name })
    setNewPlayer('')
    setPlayers((prev) => [...prev, saved])
    setPicked((prev) => [...prev, saved.id])
  }

  const selectedCourse = courses.find((c) => c.id === courseId)
  const query = courseQuery.trim().toLowerCase()
  const shownCourses = courses.filter(
    (c) => !query || `${c.name} ${c.location ?? ''}`.toLowerCase().includes(query),
  )

  const lime = theme.palette.primary.main
  const startLabel = t.roundStart.startLabel(picked.length)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 0.5, pb: 1 }}>
        <IconButton component={RouterLink} to="/" aria-label={t.common.back}>
          <Icon>{icon.back}</Icon>
        </IconButton>
        <Typography variant="h6" component="h1">{t.roundStart.title}</Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <SectionLabel>{t.roundStart.course}</SectionLabel>
          {courses.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {t.roundStart.noCourses} <Link component={RouterLink} to="/courses">{t.roundStart.addOneFirst}</Link>
            </Typography>
          )}
          {courses.length > 0 && (
            <ButtonBase
              onClick={() => { setCourseQuery(''); setCourseOpen(true) }}
              aria-haspopup="dialog"
              sx={{
                height: 60, px: 2, gap: 1.5, justifyContent: 'flex-start', textAlign: 'left',
                borderRadius: `${theme.radius.md}px`, border: 2, bgcolor: 'surface.raised',
                borderColor: selectedCourse ? 'primary.main' : 'surface.raised',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" component="span" noWrap sx={{ display: 'block' }} color={selectedCourse ? 'text.primary' : 'text.secondary'}>
                  {selectedCourse ? selectedCourse.name : t.roundStart.selectCourse}
                </Typography>
                {selectedCourse?.location && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                    {selectedCourse.location}
                  </Typography>
                )}
              </Box>
              <Icon>{icon.chevron}</Icon>
            </ButtonBase>
          )}
        </Box>

        {courseId && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <SectionLabel>{t.roundStart.layout}</SectionLabel>
            {courseLayouts.length === 0 && (
              <Typography variant="body2" color="text.secondary">{t.roundStart.noLayoutsOnCourse}</Typography>
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
                    {layout.name} · {t.common.par(layout.pars.reduce((sum, par) => sum + par, 0))}
                  </ButtonBase>
                )
              })}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <SectionLabel>{t.tabs.players}</SectionLabel>
          {players.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {t.roundStart.noPlayers} <Link component={RouterLink} to="/players">{t.roundStart.addSomeFirst}</Link>
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
          <Box component="form" onSubmit={addPlayer} sx={{ display: 'flex', gap: 1 }}>
            <OutlinedInput
              value={newPlayer}
              onChange={(e) => setNewPlayer(e.target.value)}
              placeholder={t.players.addPlaceholder}
              inputProps={{ 'aria-label': t.roundStart.newPlayerName }}
              sx={{ flex: 1, height: 48 }}
            />
            <IconButton type="submit" aria-label={t.players.addPlayer} sx={{
              width: 48, height: 48, bgcolor: 'primary.main', color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.light' },
            }}>
              <Icon size={22}>{icon.plus}</Icon>
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
          <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="overline" component="span" color="text.secondary">{t.common.date}</Typography>
            <OutlinedInput type="date" value={date} onChange={(e) => setDate(e.target.value)} sx={{ height: 52 }} />
          </Box>
          <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="overline" component="span" color="text.secondary">{t.common.note}</Typography>
            <OutlinedInput
              placeholder={t.common.optional}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              inputProps={{ 'aria-label': t.common.roundNote }}
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

      <Dialog open={courseOpen} onClose={() => setCourseOpen(false)} fullWidth maxWidth="sm" aria-label={t.roundStart.selectCourse}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, height: '70vh' }}>
          <OutlinedInput
            autoFocus
            value={courseQuery}
            onChange={(e) => setCourseQuery(e.target.value)}
            placeholder={t.roundStart.searchCourses}
            inputProps={{ 'aria-label': t.roundStart.searchCourses }}
            sx={{ height: 52, flexShrink: 0 }}
          />
          <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {shownCourses.length === 0 && (
              <Typography variant="body2" color="text.secondary">{t.roundStart.noMatching}</Typography>
            )}
            {shownCourses.map((course) => {
              const on = courseId === course.id
              return (
                <ButtonBase
                  key={course.id}
                  aria-pressed={on}
                  onClick={() => pickCourse(course.id)}
                  sx={{
                    minHeight: 60, px: 2, gap: 1.5, flexShrink: 0, justifyContent: 'flex-start', textAlign: 'left',
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
                </ButtonBase>
              )
            })}
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}
