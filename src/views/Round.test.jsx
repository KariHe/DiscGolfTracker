import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.jsx'
import { createMemoryStorage } from '../storage/memory.js'
import { StorageProvider } from '../storage/StorageProvider.jsx'

function renderAt(storage, entry) {
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
    fireEvent.click(screen.getByRole('button', { name: 'Kivilahti' }))
    fireEvent.click(screen.getByRole('button', { name: /^Short 3/ }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Start round' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Scorekeeper' })).toBeTruthy())

    fireEvent.change(screen.getByLabelText('Kari strokes hole 1'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Kari strokes hole 2'), { target: { value: '3' } })
    await waitFor(() => expect(screen.getByText(/7 \(\d\)/)).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'Finish round' }))
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

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Scorekeeper' })).toBeTruthy())
  })

  it('shows no active round when none exists', async () => {
    const { storage } = await seededRound()
    renderAt(storage, '/round')
    await waitFor(() => expect(screen.getByText('No active round')).toBeTruthy())
    expect(screen.getByRole('link', { name: 'Start a round' })).toBeTruthy()
  })
})
