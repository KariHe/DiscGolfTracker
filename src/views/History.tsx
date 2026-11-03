import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { useStorage } from '../storage/useStorage.ts'
import { playerTotals, vsParLabel } from '../domain/scores.ts'
import type { Course, Layout, Player, Round } from '../domain/types.ts'
import { playerTint, scoreColor } from '../theme'
import { useI18n } from '../i18n/useI18n.ts'

const visuallyHidden = { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)' } as const

function formatDate(date: string | undefined, locale: string) {
  if (!date) return ''
  return new Date(`${date}T00:00`)
    .toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(',', '')
    .toUpperCase()
}

export default function History() {
  const storage = useStorage()
  const theme = useTheme()
  const { t, locale } = useI18n()
  const [rounds, setRounds] = useState<Round[]>([])
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  const reload = useCallback(async () => {
    const [allRounds, allLayouts, allPlayers, allCourses] = await Promise.all([
      storage.list('rounds'),
      storage.list('layouts'),
      storage.list('players'),
      storage.list('courses'),
    ])
    setRounds(allRounds
      .filter((round) => round.finished)
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')))
    setLayouts(allLayouts)
    setPlayers(allPlayers)
    setCourses(allCourses)
  }, [storage])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1.5, pb: 2 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          {t.history.count(rounds.length)}
        </Typography>
        <Typography variant="h1" sx={{ fontSize: 34, mt: 0.5 }}>{t.tabs.history}</Typography>
      </Box>

      {rounds.length === 0 && (
        <Typography variant="body2" color="text.secondary">{t.home.noFinished}</Typography>
      )}

      {rounds.map((round) => {
        const layout = layouts.find((l) => l.id === round.layoutId) ?? null
        const course = courses.find((c) => c.id === layout?.courseId)
        const par = layout?.pars.reduce((sum, holePar) => sum + holePar, 0)
        const ranked = players
          .filter((player) => round.playerIds?.includes(player.id))
          .map((player, index) => ({ player, tint: playerTint(theme, index), ...playerTotals(round, player.id, layout) }))
          .sort((a, b) => a.total - b.total)
        return (
          <Card key={round.id}>
            <ButtonBase
              component={RouterLink}
              to={`/history/${round.id}`}
              sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1.5, p: 2, textAlign: 'left' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" component="h2" noWrap>{course?.name ?? layout?.name}</Typography>
                  <Typography variant="subtitle2" color="text.secondary" noWrap>
                    {layout?.name}{par !== undefined && ` · ${t.common.par(par)}`}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.06em', pt: '3px', whiteSpace: 'nowrap' }}>
                  {formatDate(round.date, locale)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {ranked.map(({ player, tint, total, vsPar }) => (
                  <Box key={player.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, p: '5px 10px 5px 5px', borderRadius: 999, bgcolor: 'surface.elevated' }}>
                    <Avatar aria-hidden="true" sx={{ width: 24, height: 24, fontSize: 11, bgcolor: tint }}>{player.name[0]}</Avatar>
                    <Box component="span" sx={visuallyHidden}>{player.name} </Box>
                    <Typography variant="numeric" sx={{ fontWeight: 700 }}>{total}</Typography>
                    {' '}
                    <Typography variant="numeric" sx={{ color: scoreColor(theme, vsPar ?? 0) }}>{vsParLabel(vsPar)}</Typography>
                  </Box>
                ))}
              </Box>
            </ButtonBase>
          </Card>
        )
      })}
    </Box>
  )
}
