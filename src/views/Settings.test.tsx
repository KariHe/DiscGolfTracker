import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.tsx'
import type { Storage } from '../storage/port.ts'
import { createMemoryStorage } from '../storage/memory.ts'
import { StorageProvider } from '../storage/StorageProvider.tsx'

function renderApp(storage: Storage, entry: string) {
  return render(
    <StorageProvider storage={storage}>
      <MemoryRouter initialEntries={[entry]}>
        <App />
      </MemoryRouter>
    </StorageProvider>,
  )
}

describe('Settings', () => {
  beforeEach(() => localStorage.clear())

  it('opens from the Home gear, which replaces the language switcher', async () => {
    renderApp(createMemoryStorage(), '/')
    expect(screen.queryByRole('button', { name: 'Suomi' })).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: 'Settings' }))
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Suomi' })).toBeTruthy()
    expect(screen.getAllByRole('link', { name: /^(Home|Courses|Players|History)$/ })).toHaveLength(4)
  })

  it('goes back to Home', async () => {
    renderApp(createMemoryStorage(), '/settings')
    fireEvent.click(screen.getByRole('link', { name: 'Back to home' }))
    expect(await screen.findByRole('heading', { name: 'Let’s play' })).toBeTruthy()
  })

  it('initializes courses and layouts from the bundled file and reports the result', async () => {
    const storage = createMemoryStorage()
    renderApp(storage, '/settings')

    fireEvent.click(screen.getByRole('button', { name: 'Initialize courses' }))
    expect(await screen.findByText(/^Imported \d+ courses, \d+ layouts/)).toBeTruthy()
    expect((await storage.list('courses')).length).toBeGreaterThan(50)
    expect((await storage.list('layouts')).length).toBeGreaterThan(50)
  })

  it('no longer offers course initialization on Courses', () => {
    renderApp(createMemoryStorage(), '/courses')
    expect(screen.queryByRole('button', { name: 'Initialize courses' })).toBeNull()
  })
})
