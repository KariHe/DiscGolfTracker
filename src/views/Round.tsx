import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Card from '@mui/material/Card'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { useStorage } from '../storage/useStorage.ts'
import { firstIncompleteHole, playerTotals, formatVsPar, scoreName, vsParLabel } from '../domain/scores.ts'
import type { Course, Layout, Player, Round } from '../domain/types.ts'
import { playerTint, scoreColor } from '../theme'
import { Icon } from '../components/Icon.tsx'
import { icon } from '../components/icons.tsx'

const WHEEL_ITEM = 56
const WHEEL_MAX = 10

export default function Round() {
  const storage = useStorage()
  const navigate = useNavigate()
  const theme = useTheme()
  const [round, setRound] = useState<Round | null>(null)
  const roundRef = useRef<Round | null>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [hole, setHole] = useState<number | null>(null)
  const [picking, setPicking] = useState<Player | null>(null)
  const [scorecardOpen, setScorecardOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  const reload = useCallback(async () => {
    const [allRounds, allLayouts, allPlayers, allCourses] = await Promise.all([
      storage.list('rounds'),
      storage.list('layouts'),
      storage.list('players'),
      storage.list('courses'),
    ])
    const active = allRounds.find((candidate) => !candidate.finished) ?? null
    const activeLayout = allLayouts.find((candidate) => candidate.id === active?.layoutId) ?? null
    setRound(active)
    roundRef.current = active
    setLayout(activeLayout)
    setCourse(allCourses.find((candidate) => candidate.id === activeLayout?.courseId) ?? null)
    setPlayers(allPlayers.filter((candidate) => active?.playerIds?.includes(candidate.id)))
    if (active && activeLayout) setHole(firstIncompleteHole(active, activeLayout))
  }, [storage])

  useEffect(() => {
    reload()
  }, [reload])

  function paddedStrokes(strokesOfPlayer: (number | undefined)[], holeIndex: number) {
    if (strokesOfPlayer.length > holeIndex) return strokesOfPlayer
    return [
      ...strokesOfPlayer,
      ...Array(holeIndex + 1 - strokesOfPlayer.length).fill(undefined),
    ]
  }

  async function setScore(playerId: string, holeIndex: number, strokes: number | undefined) {
    // work from the ref so rapid edits never base on a stale round state
    const current = roundRef.current
    if (!current) return
    const padded = paddedStrokes(current.scores?.[playerId] ?? [], holeIndex)
    const next = {
      ...current,
      scores: {
        ...current.scores,
        [playerId]: padded.map((previous, index) => (index === holeIndex ? strokes : previous)),
      },
    }
    roundRef.current = next
    await storage.save('rounds', next)
    setRound(next)
  }

  async function finish() {
    const current = roundRef.current
    if (!current) return
    const finished = { ...current, finished: true }
    await storage.save('rounds', finished)
    navigate('/history')
  }

  async function deleteActive() {
    setMenuAnchor(null)
    const current = roundRef.current
    if (!current) return
    if (!window.confirm('Delete active round?')) return
    await storage.delete('rounds', current.id)
    navigate('/')
  }

  if (!round || !layout || hole === null) {
    return (
      <>
        <p>No active round</p>
        <Link to="/round/new">Start a round</Link>
      </>
    )
  }

  const par = layout.pars[hole]
  const isLastHole = hole === layout.pars.length - 1
  const strokesOf = (player: Player) => round.scores?.[player.id]?.[hole] ?? par

  async function finishHole() {
    // unentered scores on this hole count as par
    for (const player of players) {
      if (typeof roundRef.current?.scores?.[player.id]?.[hole!] !== 'number') {
        await setScore(player.id, hole!, par)
      }
    }
    if (isLastHole) await finish()
    else setHole(hole! + 1)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5, pb: 1 }}>
        <IconButton aria-label="Back" onClick={() => navigate('/')}>
          <Icon>{icon.back}</Icon>
        </IconButton>
        <Box sx={{ textAlign: 'center', minWidth: 0 }}>
          <Typography variant="h6" component="h1" noWrap>
            {course?.name ?? layout.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {layout.name} · {players.length} {players.length === 1 ? 'player' : 'players'}
          </Typography>
        </Box>
        <IconButton aria-label="Round menu" onClick={(e) => setMenuAnchor(e.currentTarget)}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
          </svg>
        </IconButton>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={() => { setMenuAnchor(null); finish() }}>Finish round</MenuItem>
          <MenuItem onClick={deleteActive}>Delete active round</MenuItem>
        </Menu>
      </Box>

      <Card sx={{ mt: 1.5, p: 2.5, borderRadius: `${theme.radius.lg}px` }}>
        <Typography variant="overline" color="primary">
          Hole {hole + 1} of {layout.pars.length}
        </Typography>
        <Typography variant="h1" component="p" sx={{ mt: 0.5 }}>Par {par}</Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
          {layout.pars.map((_, index) => (
            <ButtonBase
              key={index}
              aria-label={`Go to hole ${index + 1}`}
              aria-current={index === hole ? 'step' : undefined}
              onClick={() => setHole(index)}
              sx={{ flex: 1, height: 24, alignItems: 'flex-end', borderRadius: '3px' }}
            >
              <Box sx={{
                width: '100%',
                height: index === hole ? 12 : 6,
                borderRadius: '3px',
                bgcolor: index === hole ? 'text.primary'
                  : index < hole ? 'primary.main' : 'surface.track',
              }} />
            </ButtonBase>
          ))}
        </Box>
      </Card>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
        {players.map((player, index) => {
          const before = { scores: { [player.id]: (round.scores?.[player.id] ?? []).slice(0, hole) } }
          const { vsPar } = playerTotals(before, player.id, layout)
          const strokes = strokesOf(player)
          const label = scoreName(strokes, par)
          return (
            <Card key={player.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.75, minHeight: 88 }}>
              <Avatar sx={{ bgcolor: playerTint(theme, index) }}>{player.name[0]}</Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h5" noWrap>{player.name}</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  <Typography variant="numeric" sx={{ color: scoreColor(theme, vsPar ?? 0) }}>
                    {vsParLabel(vsPar)}
                  </Typography>
                  {' '}thru {hole}
                </Typography>
              </Box>
              <ButtonBase
                aria-label={`Set throws for ${player.name}, currently ${strokes}, ${label}`}
                onClick={() => setPicking(player)}
                sx={{
                  width: 120, height: 60, pl: 2, pr: 1.5,
                  justifyContent: 'space-between',
                  borderRadius: `${theme.radius.md}px`,
                  border: 2, borderColor: 'surface.outline', bgcolor: 'surface.elevated',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="h3" component="span">{strokes}</Typography>
                  <Typography variant="scoreLabel" sx={{ mt: '3px', color: scoreColor(theme, strokes - par) }}>
                    {label}
                  </Typography>
                </Box>
                <Box sx={{ color: 'text.secondary', display: 'flex' }}><Icon size={20}>{icon.updown}</Icon></Box>
              </ButtonBase>
            </Card>
          )
        })}
      </Box>

      <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.default', pt: 1.5, pb: 1.5 }}>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ textAlign: 'center', mb: 1.5 }}>
          Totals update when you finish the hole
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton size="large" aria-label="Open scorecard" onClick={() => setScorecardOpen(true)}>
            <Icon size={24}>{icon.scorecard}</Icon>
          </IconButton>
          <Button size="large" fullWidth onClick={finishHole} endIcon={<Icon>{icon.arrow}</Icon>}>
            {isLastHole ? 'Finish round' : `Finish hole ${hole + 1}`}
          </Button>
        </Box>
      </Box>

      <Drawer
        anchor="bottom"
        open={picking !== null}
        onClose={() => setPicking(null)}
        slotProps={{ paper: { 'aria-label': `Choose throws for ${picking?.name ?? ''}` } }}
      >
        {picking && (
          <ThrowPicker
            name={picking.name}
            hole={hole}
            par={par}
            initial={strokesOf(picking)}
            onCancel={() => setPicking(null)}
            onCommit={(value) => {
              setScore(picking.id, hole, value)
              setPicking(null)
            }}
          />
        )}
      </Drawer>

      <Dialog open={scorecardOpen} onClose={() => setScorecardOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Scorecard</DialogTitle>
        <Box sx={{ overflowX: 'auto', px: 3, pb: 3 }}>
          <Box component="table" sx={{ borderCollapse: 'collapse', '& th, & td': { p: 0.5, textAlign: 'center' } }}>
            <thead>
              <tr>
                <th></th>
                {layout.pars.map((holePar, index) => (
                  <th key={index}>
                    <Typography variant="subtitle2">{index + 1}</Typography>
                    <Typography variant="caption" color="text.secondary">({holePar})</Typography>
                  </th>
                ))}
                <th><Typography variant="subtitle2">Total</Typography></th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const { total, vsPar } = playerTotals(round, player.id, layout)
                return (
                  <tr key={player.id}>
                    <td><Typography variant="subtitle2" noWrap>{player.name}</Typography></td>
                    {layout.pars.map((_, index) => (
                      <td key={index}>
                        <InputBase
                          type="number"
                          value={round.scores?.[player.id]?.[index] ?? ''}
                          inputProps={{ min: 0, 'aria-label': `${player.name} strokes hole ${index + 1}` }}
                          onChange={(e) => setScore(player.id, index,
                            e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))}
                          sx={{
                            width: 44, borderRadius: `${theme.radius.sm}px`, bgcolor: 'surface.elevated',
                            '& input': { textAlign: 'center', p: 1, MozAppearance: 'textfield' },
                            '& input::-webkit-inner-spin-button': { display: 'none' },
                          }}
                        />
                      </td>
                    ))}
                    <td>
                      <Typography variant="numeric" noWrap>{total} ({formatVsPar(vsPar)})</Typography>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}

function ThrowPicker({ name, hole, par, initial, onCancel, onCommit }: {
  name: string
  hole: number
  par: number
  initial: number
  onCancel: () => void
  onCommit: (value: number) => void
}) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const pick = useRef(Math.min(Math.max(initial, 1), WHEEL_MAX))
  const fade = (direction: string) =>
    `linear-gradient(to ${direction}, var(--fade) 10%, transparent)`

  useLayoutEffect(() => {
    if (wheelRef.current) wheelRef.current.scrollTop = (pick.current - 1) * WHEEL_ITEM
  }, [])

  return (
    <>
      <Box aria-hidden="true" sx={{ width: 40, height: 4, borderRadius: '2px', bgcolor: 'surface.handle', mx: 'auto', mb: 2 }} />
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4">{name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Throws on hole {hole + 1} · scroll to choose
        </Typography>
      </Box>
      <Box sx={(t) => ({ position: 'relative', height: 224, mt: 1.5, '--fade': t.palette.surface.raised })}>
        <Box
          ref={wheelRef}
          role="group"
          aria-label="Throw count wheel"
          tabIndex={0}
          onScroll={(e) => {
            const index = Math.round(e.currentTarget.scrollTop / WHEEL_ITEM)
            pick.current = Math.min(Math.max(index + 1, 1), WHEEL_MAX)
          }}
          sx={{
            height: 224, overflowY: 'auto', scrollSnapType: 'y mandatory', overscrollBehavior: 'contain',
            scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Box sx={{ height: 84 }} />
          {Array.from({ length: WHEEL_MAX }, (_, k) => k + 1).map((value) => (
            <Box key={value} sx={{ height: WHEEL_ITEM, scrollSnapAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
              <Typography variant="h2" component="span" sx={{ width: 44, textAlign: 'right' }}>{value}</Typography>
              <Typography variant="subtitle1" component="span" color="text.secondary" sx={{ width: 80 }}>
                {scoreName(value, par)}
              </Typography>
            </Box>
          ))}
          <Box sx={{ height: 84 }} />
        </Box>
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: '0 0 auto 0', height: 84, pointerEvents: 'none', background: fade('bottom') }} />
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 'auto 0 0 0', height: 84, pointerEvents: 'none', background: fade('top') }} />
        <Box aria-hidden="true" sx={(t) => ({
          position: 'absolute', left: 0, right: 0, top: 84, height: WHEEL_ITEM, pointerEvents: 'none',
          borderRadius: `${t.radius.sm}px`, border: `2px solid ${t.palette.primary.main}`, bgcolor: 'action.selected',
        })} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        <Button variant="outlined" onClick={onCancel} sx={{ flex: 1 }}>Cancel</Button>
        <Button onClick={() => onCommit(pick.current)} sx={{ flex: 1.4 }}>Set score</Button>
      </Box>
    </>
  )
}
