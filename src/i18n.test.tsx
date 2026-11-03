import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StorageProvider } from './storage/StorageProvider.tsx'
import { createMemoryStorage } from './storage/memory.ts'
import App from './App.tsx'

function renderApp() {
  return render(
    <StorageProvider storage={createMemoryStorage()}>
      <MemoryRouter>
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
})
