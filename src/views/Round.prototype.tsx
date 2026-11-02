// PROTOTYPE, throwaway: three touch-first variants of the /round Scorekeeper
// screen, switchable via the ?variant= search param. Scores are kept in local
// state only — nothing is written to storage, so the real active round is safe.
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useSearchParams } from 'react-router'
import { playerTotals, formatVsPar } from '../domain/scores.ts'
import './Round.prototype.css'
import type { Layout, Player, Round } from '../domain/types.ts'

interface VariantProps {
  round: Round
  layout: Layout
  players: Player[]
}

const VARIANTS = [
  ['0', 'Current table'],
  ['A', 'Hole wizard'],
  ['B', 'Tally grid'],
  ['C', 'Keypad sheet'],
]

/** Local, un-persisted copy of the round's scores plus a clamped setScore. */
function useLocalScores(round: Round) {
  const [scores, setScores] = useState<Record<string, (number | undefined)[]>>(() => round?.scores ?? {})
  const setScore = useCallback(
    (playerId: string, holeIndex: number, value: number) => {
      setScores((previous) => {
        const strokesOfPlayer = previous[playerId] ?? []
        const padded = strokesOfPlayer.length > holeIndex
          ? strokesOfPlayer
          : [...strokesOfPlayer, ...Array(holeIndex + 1 - strokesOfPlayer.length).fill(undefined)]
        return {
          ...previous,
          [playerId]: padded.map((stroke, hole) =>
            hole === holeIndex ? (value < 0 ? undefined : value) : stroke),
        }
      })
    },
    [],
  )
  return { scores, setScore }
}

/** Pin strokes to par: -1/under = green, 0 = neutral, +1/over = red. */
function toneClass(stroke: number | undefined, par: number) {
  if (typeof stroke !== 'number') return 'blank'
  return stroke < par ? 'under' : stroke > par ? 'over' : ''
}

function totalsFor(round: { scores?: Round['scores'] }, player: Player, layout: Layout) {
  const { total, vsPar } = playerTotals({ scores: round.scores }, player.id, layout)
  return { total, vsPar: formatVsPar(vsPar) }
}

/* A: whole scorecard collapses to one hole; big +/- steppers per player. */
function HoleWizard({ round, layout, players }: VariantProps) {
  const [holeIndex, setHoleIndex] = useState(0)
  const { scores, setScore } = useLocalScores(round)
  const cloned = useMemo(() => ({ scores }), [scores])
  const par = layout.pars[holeIndex]
  const step = (playerId: string, delta: number) => {
    const current = scores[playerId]?.[holeIndex]
    if (delta > 0 || typeof current === 'number') {
      setScore(playerId, holeIndex, (typeof current === 'number' ? current : 0) + delta)
    }
  }
  return (
    <>
      <div className="wiz-holebar">
        <button
          onClick={() => setHoleIndex(Math.max(0, holeIndex - 1))}
          disabled={holeIndex === 0}
          aria-label="Previous hole"
        >‹</button>
        <div className="wiz-holenum">
          Hole {holeIndex + 1}
          <small>par {par}</small>
        </div>
        <button
          onClick={() => setHoleIndex(Math.min(layout.pars.length - 1, holeIndex + 1))}
          disabled={holeIndex === layout.pars.length - 1}
          aria-label="Next hole"
        >›</button>
      </div>
      <div className="wiz-dots">
        {layout.pars.map((_, hole) => (hole === holeIndex ? '●' : '·'))}
      </div>
      {players.map((player) => {
        const stroke = scores[player.id]?.[holeIndex]
        return (
          <div className="wiz-player" key={player.id}>
            <span className="name">{player.name}</span>
            <span className={`badge ${toneClass(stroke, par)}`}>
              {typeof stroke === 'number' ? (stroke - par > 0 ? `+${stroke - par}` : stroke - par) : ''}
            </span>
            <button className="wiz-step" onClick={() => step(player.id, -1)} aria-label={`${player.name} minus`}>−</button>
            <span className="wiz-score">{typeof stroke === 'number' ? stroke : '·'}</span>
            <button className="wiz-step" onClick={() => step(player.id, 1)} aria-label={`${player.name} plus`}>+</button>
          </div>
        )
      })}
      <div className="proto-totals">
        {players.map((player) => {
          const { total, vsPar } = totalsFor(cloned, player, layout)
          return <span key={player.id}>{player.name}: {total} ({vsPar})</span>
        })}
      </div>
    </>
  )
}

/* B: mobile-friendly digital scorecard — tap a cell to add a stroke,
   hold to take one back. No inputs, no keyboard. */
function TallyGrid({ round, layout, players }: VariantProps) {
  const { scores, setScore } = useLocalScores(round)
  const cloned = useMemo(() => ({ scores }), [scores])

  const onTap = (playerId: string, holeIndex: number) => {
    const stroke = scores[playerId]?.[holeIndex] ?? -1
    setScore(playerId, holeIndex, stroke + 1)
  }
  const onHold = (playerId: string, holeIndex: number) => {
    const stroke = scores[playerId]?.[holeIndex]
    if (typeof stroke === 'number') setScore(playerId, holeIndex, stroke - 1)
  }
  const holdHandlers = (playerId: string, holeIndex: number) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let held = false
    return {
      onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
      onPointerDown: () => {
        held = false
        timer = setTimeout(() => { held = true; onHold(playerId, holeIndex) }, 450)
      },
      onPointerUp: () => {
        clearTimeout(timer)
        if (!held) onTap(playerId, holeIndex)
      },
      onPointerLeave: () => clearTimeout(timer),
    }
  }
  return (
    <>
      <div className="tally-scroll">
        <table className="tally-grid">
          <thead>
            <tr>
              <th></th>
              {layout.pars.map((par, hole) => (
                <th key={hole}>{hole + 1}<br />({par})</th>
              ))}
              <th>T</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const { total, vsPar } = totalsFor(cloned, player, layout)
              return (
                <tr key={player.id}>
                  <th className="tally-name">{player.name}</th>
                  {layout.pars.map((par, hole) => {
                    const stroke = scores[player.id]?.[hole]
                    return (
                      <td
                        key={hole}
                        className={`tally-cell ${toneClass(stroke, par)}`}
                        aria-label={`${player.name} hole ${hole + 1}: ${typeof stroke === 'number' ? stroke : 'blank'}; tap adds a stroke, hold removes one`}
                        {...holdHandlers(player.id, hole)}
                      >{typeof stroke === 'number' ? stroke : ''}</td>
                    )
                  })}
                  <th>{total} <small>{vsPar}</small></th>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="tally-hint">Tap = one stroke. Hold = take one back.</p>
    </>
  )
}

/* C: player tabs + hole strip; tapping a hole opens a big numeric sheet. */
function KeypadSheet({ round, layout, players }: VariantProps) {
  const [activePlayerId, setActivePlayerId] = useState(players[0]?.id)
  const [activeHole, setActiveHole] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const { scores, setScore } = useLocalScores(round)
  const cloned = useMemo(() => ({ scores }), [scores])

  const openHole = (holeIndex: number) => {
    setActiveHole(holeIndex)
    setDraft('')
  }
  const pressKey = (key: string) => {
    if (key === '⌫') setDraft((d) => d.slice(0, -1))
    else if (draft.length < 2) setDraft((d) => d + key)
  }
  const commit = () => {
    if (activeHole === null || activePlayerId === undefined) return
    const value = draft === '' ? undefined : Math.max(0, Number(draft))
    setScore(activePlayerId, activeHole, value === undefined ? -1 : value)
    openHole(Math.min(layout.pars.length - 1, activeHole + 1))
  }
  return (
    <>
      <div className="key-playerbar">
        {players.map((player) => {
          const { total, vsPar } = totalsFor(cloned, player, layout)
          return (
            <button
              key={player.id}
              className={player.id === activePlayerId ? 'active' : ''}
              onClick={() => setActivePlayerId(player.id)}
            >
              {player.name} · {total} ({vsPar})
            </button>
          )
        })}
      </div>
      <div className="key-holestrip">
        {layout.pars.map((par, hole) => {
          const stroke = scores[activePlayerId]?.[hole]
          return (
            <button
              key={hole}
              className={`key-hole ${toneClass(stroke, par)} ${hole === activeHole ? 'active' : ''}`}
              onClick={() => openHole(hole)}
              aria-label={`Hole ${hole + 1}, par ${par}: ${typeof stroke === 'number' ? stroke : 'blank'}`}
            >
              {typeof stroke === 'number' ? stroke : par}
            </button>
          )
        })}
      </div>
      {activeHole !== null && (
        <div className="key-sheet">
          <p className="label">
            {players.find((p) => p.id === activePlayerId)?.name} — hole {activeHole + 1} (par {layout.pars[activeHole]})
          </p>
          <div className="value">{draft || '\u00a0'}</div>
          <div className="key-pad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
              <button key={key} onClick={() => pressKey(key)}>{key}</button>
            ))}
            <button onClick={() => pressKey('⌫')} aria-label="Delete digit">⌫</button>
            <button onClick={() => pressKey('0')}>0</button>
            <button onClick={commit} aria-label="Confirm score">✓</button>
            <button className="done" onClick={() => (draft === '' ? openHole(activeHole) : commit())}>Save &amp; next hole</button>
          </div>
        </div>
      )}
    </>
  )
}

/* 0: the current desktop scorecard, for side-by-side comparison. */
function CurrentTable({ round, layout, players }: VariantProps) {
  return (
    <table>
      <thead>
        <tr>
          <th></th>
          {layout.pars.map((par, hole) => (
            <th key={hole}>{hole + 1} <small>({par})</small></th>
          ))}
          <th>Total vs par</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player) => {
          const { total, vsPar } = totalsFor(round, player, layout)
          return (
            <tr key={player.id}>
              <td>{player.name}</td>
              {layout.pars.map((_, hole) => (
                <td key={hole}>{round.scores?.[player.id]?.[hole] ?? ''}</td>
              ))}
              <td>{total} ({vsPar})</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function PrototypeSwitcher({ current }: { current: string }) {
  const [, setSearchParams] = useSearchParams()
  const index = VARIANTS.findIndex(([key]) => key === current)
  const wrap = (delta: number) => {
    const next = VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length]
    setSearchParams({ variant: next[0] }, { replace: true })
  }
  const cycle = useCallback(wrap, [index, setSearchParams])
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.key === 'ArrowRight') cycle(1)
      else if (e.key === 'ArrowLeft') cycle(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cycle])
  const [, name] = VARIANTS[index]
  return (
    <div className="proto-switcher">
      <button onClick={() => cycle(-1)} aria-label="Previous variant">←</button>
      <span>{current} ({name})</span>
      <button onClick={() => cycle(1)} aria-label="Next variant">→</button>
    </div>
  )
}

export default function RoundPrototype({ round, layout, players }: VariantProps) {
  const [searchParams] = useSearchParams()
  const variant = searchParams.get('variant') ?? '0'
  const props = { round, layout, players }
  return (
    <>
      <div className="proto-toolbar">
        <h2>Scorekeeper</h2>
        <span>{layout.name} — {layout.pars.length} holes</span>
      </div>
      {variant === '0' && <CurrentTable {...props} />}
      {variant === 'A' && <HoleWizard {...props} />}
      {variant === 'B' && <TallyGrid {...props} />}
      {variant === 'C' && <KeypadSheet {...props} />}
      {import.meta.env.DEV && <PrototypeSwitcher current={variant} />}
    </>
  )
}
