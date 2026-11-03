import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StorageProvider } from './storage/StorageProvider.tsx'
import { createMemoryStorage } from './storage/memory.ts'
import App from './App.tsx'

function renderApp(storage = createMemoryStorage(), initialEntry = '/') {
  return render(
    <StorageProvider storage={storage}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </StorageProvider>,
  )
}

function browserLanguage(language: string) {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(language)
}

describe('language', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = ''
  })
  afterEach(() => vi.restoreAllMocks())

  it('starts in Finnish for a Finnish browser', () => {
    browserLanguage('fi-FI')
    renderApp()
    expect(screen.getByRole('link', { name: 'Radat' })).toBeTruthy()
    expect(document.documentElement.lang).toBe('fi')
  })

  it('falls back to English for an unsupported browser language', () => {
    browserLanguage('de-DE')
    renderApp()
    expect(screen.getByRole('link', { name: 'Courses' })).toBeTruthy()
    expect(document.documentElement.lang).toBe('en')
  })

  it('switches language from Home', () => {
    browserLanguage('en-US')
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Suomi' }))
    expect(screen.getByRole('link', { name: 'Radat' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Pelataan' })).toBeTruthy()
    expect(document.documentElement.lang).toBe('fi')
  })

  it('remembers the choice after a remount', () => {
    browserLanguage('en-US')
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Suomi' }))
    cleanup()
    renderApp()
    expect(screen.getByRole('link', { name: 'Radat' })).toBeTruthy()
  })

  it('formats History dates and keeps user names as typed in Finnish', async () => {
    browserLanguage('fi-FI')
    const storage = createMemoryStorage()
    const course = await storage.save('courses', { name: 'Kivilahti' })
    const layout = await storage.save('layouts', { courseId: course.id, name: 'Short 2', pars: [3, 3] })
    const player = await storage.save('players', { name: 'Kari' })
    await storage.save('rounds', {
      finished: true, date: '2026-10-19', layoutId: layout.id, playerIds: [player.id], scores: { [player.id]: [3, 3] },
    })
    renderApp(storage, '/history')
    const card = await screen.findByRole('link', { name: /Kivilahti/ })
    expect(screen.getByText('1 päättynyt kierros')).toBeTruthy()
    expect(card.textContent).toMatch(/Short 2 · par 6/)
    expect(card.textContent).toMatch(/MA 19\.10\./)
    expect(card.textContent).toMatch(/Kari/)
  })
})
