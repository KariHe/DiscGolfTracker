import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { useStorage } from '../storage/useStorage.ts'
import { playerTotals, vsParLabel } from '../domain/scores.ts'
import type { Course, Layout, Player, Round } from '../domain/types.ts'
import { playerTint, scoreColor } from '../theme'
import type { Dictionary } from '../i18n/dictionaries.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { Icon } from '../components/Icon.tsx'
import { icon } from '../components/icons.tsx'

const CHUNK = 9
const scoreGrid = { display: 'grid', gridTemplateColumns: '36px repeat(9, minmax(0, 1fr)) 34px', gap: '2px', alignItems: 'center', textAlign: 'center' } as const

function formatLongDate(date: string | undefined, locale: string) {
  if (!date) return ''
  return new Date(`${date}T00:00`)
    .toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .replace(',', '')
}

function chunkLabel(t: Dictionary['historyDetail'], chunk: number, chunkCount: number, holeCount: number) {
  if (chunkCount === 2 && holeCount === 18) return chunk === 0 ? t.front9 : t.back9
  const first = chunk * CHUNK + 1
  return t.holesRange(first, Math.min(first + CHUNK - 1, holeCount))
}

function paddedStrokes(strokesOfPlayer: (number | undefined)[], holeIndex: number) {
  if (strokesOfPlayer.length > holeIndex) return strokesOfPlayer
  return [...strokesOfPlayer, ...Array(holeIndex + 1 - strokesOfPlayer.length).fill(undefined)]
}

export default function HistoryDetail() {
  const { roundId } = useParams()
  const storage = useStorage()
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const [round, setRound] = useState<Round | null>(null)
  const roundRef = useRef<Round | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')
  const [editing, setEditing] = useState(false)
  const [chunk, setChunk] = useState(0)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const theme = useTheme()

  const reload = useCallback(async () => {
    const [found, allPlayers] = await Promise.all([
      storage.get('rounds', roundId ?? ''),
      storage.list('players'),
    ])
    setRound(found ?? null)
    roundRef.current = found ?? null
    setPlayers(allPlayers)
    if (!found) return
    setNote(found.note ?? '')
    setDate(found.date ?? '')
    const layoutOfRound = found.layoutId
      ? await storage.get('layouts', found.layoutId)
      : null
    setLayout(layoutOfRound ?? null)
    setCourse((layoutOfRound ? await storage.get('courses', layoutOfRound.courseId) : null) ?? null)
  }, [storage, roundId])

  useEffect(() => {
    reload()
  }, [reload])

  if (!round) {
    return (
      <>
        <p>{t.historyDetail.notFound}</p>
        <Link to="/history">{t.tabs.history}</Link>
      </>
    )
  }

  async function setScore(playerId: string, holeIndex: number, rawValue: string) {
    // work from the ref so rapid edits never base on a stale round state
    const current = roundRef.current
    if (!current) return
    const padded = paddedStrokes(current.scores?.[playerId] ?? [], holeIndex)
    const typed = rawValue === '' ? undefined : Math.max(0, Number(rawValue))
    const next = {
      ...current,
      scores: {
        ...current.scores,
        [playerId]: padded.map((previous, hole) => (hole === holeIndex ? typed : previous)),
      },
    }
    roundRef.current = next
    await storage.save('rounds', next)
    setRound(next)
  }

  async function saveDetails() {
    const current = roundRef.current
    if (!current) return
    const details = { ...current, date, note: note.trim() || undefined }
    roundRef.current = details
    await storage.save('rounds', details)
    setEditing(false)
    reload()
  }

  async function remove() {
    setMenuAnchor(null)
    if (!round) return
    if (!window.confirm(t.historyDetail.deleteConfirm)) return
    await storage.delete('rounds', round.id)
    navigate('/history')
  }

  const playersWithScores = Object.keys(round.scores ?? {})
  const pars = layout?.pars ?? []
  const parTotal = pars.reduce((sum, par) => sum + par, 0)
  const standings = playersWithScores
    .map((playerId, index) => ({
      playerId,
      name: players.find((candidate) => candidate.id === playerId)?.name ?? '?',
      tint: playerTint(theme, index),
      ...playerTotals(round, playerId, layout),
    }))
  const ranked = [...standings].sort((a, b) => a.total - b.total)
  const chunkCount = Math.ceil(pars.length / CHUNK)
  const from = Math.min(chunk, Math.max(chunkCount - 1, 0)) * CHUNK
  const holes = pars.slice(from, from + CHUNK).map((par, offset) => ({ index: from + offset, par }))
  const sumOf = (values: (number | undefined)[]) =>
    values.reduce<number>((sum, value) => (typeof value === 'number' ? sum + value : sum), 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pt: 0.5, pb: 1 }}>
        <IconButton component={Link} to="/history" aria-label={t.historyDetail.backToHistory}>
          <Icon>{icon.back}</Icon>
        </IconButton>
        <Box sx={{ textAlign: 'center', minWidth: 0 }}>
          <Typography variant="h6" component="h1" noWrap>{course?.name ?? layout?.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {[layout?.name, formatLongDate(round.date, locale)].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
        <IconButton aria-label={t.round.roundMenu} onClick={(e) => setMenuAnchor(e.currentTarget)}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
          </svg>
        </IconButton>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={remove}>{t.historyDetail.deleteRound}</MenuItem>
        </Menu>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1.5 }}>
        <Card sx={{ p: 2, borderRadius: `${theme.radius.lg}px` }}>
          <Typography variant="overline" color="primary">
            {t.historyDetail.final}{layout && ` · ${t.common.par(parTotal)}`}
          </Typography>
          {ranked.map((row, rank) => (
            <Box key={row.playerId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: 44 }}>
              <Typography variant="numeric" color="text.secondary" sx={{ width: 16, textAlign: 'center' }}>{rank + 1}</Typography>
              <Avatar aria-hidden="true" sx={{ width: 32, height: 32, fontSize: 14, bgcolor: row.tint }}>{row.name[0]}</Avatar>
              <Typography variant="h6" component="span" noWrap sx={{ flex: 1 }}>{row.name}</Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.total}</Typography>
              <Typography sx={{ width: 40, textAlign: 'right', fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: scoreColor(theme, row.vsPar ?? 0) }}>
                {vsParLabel(row.vsPar)}
              </Typography>
            </Box>
          ))}
        </Card>

        {layout && (
          <Card sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {chunkCount > 1 && (
              <Box role="group" aria-label={t.historyDetail.scorecardHoles} sx={{
                display: 'grid', gridTemplateColumns: `repeat(${chunkCount}, minmax(0, 1fr))`, gap: 0.5,
                p: 0.5, borderRadius: 999, bgcolor: 'background.default',
              }}>
                {Array.from({ length: chunkCount }, (_, index) => {
                  const on = from === index * CHUNK
                  return (
                    <ButtonBase key={index} aria-pressed={on} onClick={() => setChunk(index)} sx={{
                      height: 36, borderRadius: 999, fontSize: 14, fontWeight: 700,
                      bgcolor: on ? 'surface.elevated' : 'transparent',
                      color: on ? 'text.primary' : 'text.secondary',
                    }}>
                      {chunkLabel(t.historyDetail, index, chunkCount, pars.length)}
                    </ButtonBase>
                  )
                })}
              </Box>
            )}
            <Box sx={{ ...scoreGrid, height: 26, fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>
              <Box component="span" sx={{ textAlign: 'left', pl: 0.5 }}>{t.historyDetail.hole}</Box>
              {holes.map((hole) => <span key={hole.index}>{hole.index + 1}</span>)}
              <span>{t.historyDetail.tot}</span>
            </Box>
            <Box sx={{ ...scoreGrid, height: 26, fontSize: 12, fontWeight: 700, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' }}>
              <Box component="span" sx={{ textAlign: 'left', pl: 0.5 }}>{t.historyDetail.par}</Box>
              {holes.map((hole) => <span key={hole.index}>{hole.par}</span>)}
              <span>{sumOf(holes.map((hole) => hole.par))}</span>
            </Box>
            {standings.map((row) => {
              const strokes = round.scores?.[row.playerId] ?? []
              return (
                <Box key={row.playerId} sx={{ ...scoreGrid, minHeight: 30 }}>
                  <Avatar aria-label={row.name} sx={{ width: 24, height: 24, fontSize: 11, bgcolor: row.tint }}>{row.name[0]}</Avatar>
                  {holes.map((hole) => {
                    const value = strokes[hole.index]
                    if (editing) {
                      return (
                        <InputBase
                          key={hole.index}
                          type="number"
                          value={value ?? ''}
                          inputProps={{ min: 0, 'aria-label': t.common.strokesAria(row.name, hole.index + 1) }}
                          onChange={(e) => setScore(row.playerId, hole.index, e.target.value)}
                          sx={{
                            height: 30, borderRadius: '9px', bgcolor: 'surface.elevated', fontSize: 14, fontWeight: 800,
                            '& input': { textAlign: 'center', p: 0, MozAppearance: 'textfield' },
                            '& input::-webkit-inner-spin-button': { display: 'none' },
                          }}
                        />
                      )
                    }
                    const diff = typeof value === 'number' ? value - hole.par : 0
                    return (
                      <Box key={hole.index} component="span" sx={{
                        justifySelf: 'center', width: 26, height: 26, borderRadius: '9px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                        color: scoreColor(theme, diff),
                        bgcolor: diff < 0 ? alpha(theme.palette.score.under, 0.16)
                          : diff > 0 ? alpha(theme.palette.score.over, 0.14) : 'transparent',
                      }}>
                        {value ?? '–'}
                      </Box>
                    )
                  })}
                  <Typography variant="numeric" sx={{ fontSize: 14 }}>{sumOf(holes.map((hole) => strokes[hole.index]))}</Typography>
                </Box>
              )
            })}
          </Card>
        )}

        {editing ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
            <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="overline" component="span" color="text.secondary">{t.common.date}</Typography>
              <OutlinedInput type="date" value={date} onChange={(e) => setDate(e.target.value)}
                inputProps={{ 'aria-label': t.historyDetail.roundDate }} sx={{ height: 52 }} />
            </Box>
            <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="overline" component="span" color="text.secondary">{t.common.note}</Typography>
              <OutlinedInput placeholder={t.common.optional} value={note} onChange={(e) => setNote(e.target.value)}
                inputProps={{ 'aria-label': t.common.roundNote }} sx={{ height: 52 }} />
            </Box>
          </Box>
        ) : round.note && (
          <Card sx={{ p: '14px 16px' }}>
            <Typography variant="overline" color="text.secondary">{t.common.note}</Typography>
            <Typography sx={{ mt: 0.5 }}>{round.note}</Typography>
          </Card>
        )}
      </Box>

      <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.default', pt: 1.5, pb: 1.5 }}>
        {editing ? (
          <Button size="large" fullWidth onClick={saveDetails}>{t.historyDetail.saveDetails}</Button>
        ) : (
          <Button size="large" variant="outlined" fullWidth onClick={() => setEditing(true)}
            startIcon={<Icon size={18}>{icon.edit}</Icon>}>
            {t.historyDetail.editRound}
          </Button>
        )}
      </Box>
    </Box>
  )
}
