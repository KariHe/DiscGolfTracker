import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StorageProvider } from './storage/StorageProvider.tsx'
import { createMemoryStorage } from './storage/memory.ts'
import App from './App.tsx'

function renderApp(initialEntry = '/') {
  return render(
    <StorageProvider storage={createMemoryStorage()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </StorageProvider>,
  )
}

describe('app shell', () => {
  it('navigates between phase-1 routes', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /Let.s play/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Courses' }))
    expect(screen.getByRole('heading', { name: 'Courses' })).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Players' }))
    expect(screen.getByRole('heading', { name: 'Players' })).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'History' }))
    expect(screen.getByRole('heading', { name: 'History' })).toBeTruthy()
  })

  it('offers Start a round on Home when no round is active', async () => {
    renderApp()
    expect(await screen.findByRole('link', { name: 'Start a round' })).toBeTruthy()
  })

  it('offers Resume round on Home for the active round', async () => {
    const storage = createMemoryStorage()
    const course = await storage.save('courses', { name: 'Kivilahti' })
    const layout = await storage.save('layouts', { courseId: course.id, name: 'Short 3', pars: [3, 4, 3] })
    const player = await storage.save('players', { name: 'Kari' })
    await storage.save('rounds', { finished: false, layoutId: layout.id, playerIds: [player.id], scores: { [player.id]: [3] } })
    render(
      <StorageProvider storage={storage}>
        <MemoryRouter><App /></MemoryRouter>
      </StorageProvider>,
    )
    expect(await screen.findByRole('link', { name: /Resume round/ })).toBeTruthy()
    expect(screen.getByText('Short 3 · 1 player · Hole 2 of 3')).toBeTruthy()
  })

  it('renders deep link to active round', () => {
    renderApp('/round')
    expect(screen.getByText('No active round')).toBeTruthy()
  })

  it('renders deep link to round detail', () => {
    renderApp('/history/abc')
    expect(screen.getByText('Round not found')).toBeTruthy()
  })
})
