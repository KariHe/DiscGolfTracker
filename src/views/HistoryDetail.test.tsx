import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.tsx'
import type { Storage } from '../storage/port.ts'
import type { Layout, Round } from '../domain/types.ts'
import { createMemoryStorage } from '../storage/memory.ts'
import { StorageProvider } from '../storage/StorageProvider.tsx'

function renderAt(storage: Storage, entry: string) {
  return render(
    <StorageProvider storage={storage}>
      <MemoryRouter initialEntries={[entry]}>
        <App />
      </MemoryRouter>
    </StorageProvider>,
  )
}

async function seededHistory(options: { note?: string; noScores?: boolean } = {}) {
  const storage = createMemoryStorage()
  const course = await storage.save('courses', { name: 'Kivilahti' })
  const layout = await storage.save('layouts', {
    courseId: course.id,
    name: 'Short 3',
    pars: [3, 4],
  })
  const player = await storage.save('players', { name: 'Kari' })
  const round = await storage.save('rounds', {
    finished: true,
    date: '2026-10-15',
    note: options.note,
    layoutId: layout.id,
    playerIds: [player.id],
    scores: options.noScores ? {} : { [player.id]: [4, 5] },
  })
  return { storage, course, layout, player, round }
}

describe('Round lifecycle', () => {
  it('deletes the active round after confirm and returns home', async () => {
    const { storage, layout } = await seededHistory()
    const active = await storage.save('rounds', {
      finished: false,
      date: '2026-11-01',
      layoutId: layout.id,
      playerIds: [],
      scores: {},
    })
    vi.stubGlobal("confirm", () => true)
    renderAt(storage, '/round')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Delete active round' })).toBeTruthy(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete active round' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Home' })).toBeTruthy())
    expect(await storage.get('rounds', active.id)).toBeUndefined()
  })

  it('keeps the active round when the confirm is dismissed', async () => {
    const { storage, layout, round } = await seededHistory()
    void round
    await storage.save('rounds', {
      finished: false,
      date: '2026-11-01',
      layoutId: layout.id,
      playerIds: [],
      scores: {},
    })
    vi.stubGlobal("confirm", () => false)
    renderAt(storage, '/round')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Delete active round' })).toBeTruthy(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete active round' }))
    expect(await storage.list('rounds')).toHaveLength(2)
  })

  it('edits a finished round from History detail (scores, date, note)', async () => {
    const { storage, round } = await seededHistory()
    renderAt(storage, `/history/${round.id}`)

    await waitFor(() => expect(screen.getByLabelText('Round note')).toBeTruthy())
    fireEvent.change(screen.getByLabelText('Kari strokes hole 1'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Round note'), { target: { value: 'windy' } })
    fireEvent.change(screen.getByLabelText('Round date'), { target: { value: '2026-10-16' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }))

    await waitFor(async () => {
      const saved = await storage.get('rounds', round.id)
      expect(saved?.scores?.[round.playerIds?.[0] as string]).toEqual([2, 5])
      expect(saved?.note).toBe('windy')
      expect(saved?.date).toBe('2026-10-16')
    })
  })

  it('deletes a finished round, which re-opens hard-delete of its references', async () => {
    const { storage, round, player, course } = await seededHistory()
    const layoutUsed = await storage.get('layouts', round.layoutId as string)
    vi.stubGlobal("confirm", () => true)
    renderAt(storage, `/history/${round.id}`)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Delete round' })).toBeTruthy(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete round' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'History' })).toBeTruthy())
    expect(await storage.list('rounds')).toHaveLength(0)

    // with nothing referencing them, the Player and Layout are hard-deletable;
    // the Course stays blocked while it still offers the Layout (ticket 02 rule)
    const { playerIsReferenced, layoutIsReferenced, courseIsReferenced } =
      await import('../domain/records.ts')
    const rounds: Round[] = []
    expect(playerIsReferenced(rounds, player.id)).toBe(false)
    expect(layoutIsReferenced(rounds, layoutUsed?.id as string)).toBe(false)
    expect(courseIsReferenced([layoutUsed as Layout], rounds, course.id)).toBe(true)
  })

  it('shows Round not found for a missing round id', async () => {
    const { storage } = await seededHistory()
    renderAt(storage, '/history/nope')
    await waitFor(() => expect(screen.getByText('Round not found')).toBeTruthy())
  })
})
