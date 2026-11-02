import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.tsx'
import type { Storage } from '../storage/port.ts'
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

async function seededRound() {
  const storage = createMemoryStorage()
  const course = await storage.save('courses', { name: 'Kivilahti' })
  const layout = await storage.save('layouts', {
    courseId: course.id,
    name: 'Short 3',
    pars: [3, 4],
  })
  const player = await storage.save('players', { name: 'Kari' })
  return { storage, course, layout, player }
}

describe('Scorekeeper round', () => {
  it('starts a round, enters scores, and finishes into History', async () => {
    const { storage } = await seededRound()
    renderAt(storage, '/round/new')

    await waitFor(() => expect(screen.getByRole('button', { name: 'Kivilahti' })).toBeTruthy())
    const startButton = () => screen.getByRole('button', { name: /^Start round/ }) as HTMLButtonElement
    expect(startButton().disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Kivilahti' }))
    fireEvent.click(screen.getByRole('button', { name: /^Short 3/ }))
    expect(startButton().disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Kari' }))
    expect(startButton().disabled).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: /^Start round/ }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Kivilahti' })).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'Open scorecard' }))
    fireEvent.change(screen.getByLabelText('Kari strokes hole 1'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Kari strokes hole 2'), { target: { value: '3' } })
    await waitFor(() => expect(screen.getByText(/7 \(\d\)/)).toBeTruthy())

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    fireEvent.click(await screen.findByRole('button', { name: 'Round menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Finish round' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'History' })).toBeTruthy())
    expect(screen.getByText(/7 \(/)).toBeTruthy()
    const rounds = await storage.list('rounds')
    expect(rounds).toHaveLength(1)
    expect(rounds[0].finished).toBe(true)
  })

  it('redirects to the active round when one exists', async () => {
    const { storage, layout } = await seededRound()
    await storage.save('rounds', {
      finished: false,
      layoutId: layout.id,
      playerIds: [],
      scores: {},
    })
    renderAt(storage, '/round/new')

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Kivilahti' })).toBeTruthy())
  })

  it('scores a hole with the picker and advances on finish hole', async () => {
    const { storage, layout, player } = await seededRound()
    await storage.save('rounds', {
      finished: false,
      layoutId: layout.id,
      playerIds: [player.id],
      scores: {},
    })
    renderAt(storage, '/round')

    await waitFor(() => expect(screen.getByText('Hole 1 of 2')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /^Set throws for Kari, currently 3/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Set score' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Finish hole 1' }))

    await waitFor(() => expect(screen.getByText('Hole 2 of 2')).toBeTruthy())
    const [saved] = await storage.list('rounds')
    expect(saved.scores?.[player.id]?.[0]).toBe(3)
    expect(screen.getByRole('button', { name: 'Finish round' })).toBeTruthy()
  })

  it('shows no active round when none exists', async () => {
    const { storage } = await seededRound()
    renderAt(storage, '/round')
    await waitFor(() => expect(screen.getByText('No active round')).toBeTruthy())
    expect(screen.getByRole('link', { name: 'Start a round' })).toBeTruthy()
  })
})
