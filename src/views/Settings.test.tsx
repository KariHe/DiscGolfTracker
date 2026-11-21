import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('downloads a Backup file named by local date', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 21, 23, 30))
    const storage = createMemoryStorage()
    await storage.save('players', { id: 'p1', name: 'Kari' })
    let blob: Blob | undefined
    URL.createObjectURL = vi.fn((b: Blob) => { blob = b; return 'blob:backup' })
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('discgolf-backup-2026-11-21.json')
      expect(this.href).toBe('blob:backup')
    })
    renderApp(storage, '/settings')

    fireEvent.click(screen.getByRole('button', { name: 'Download backup' }))

    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    const file = JSON.parse(await blob!.text())
    expect(file).toMatchObject({ format: 'discgolf-backup', version: 1, data: { players: [{ id: 'p1', name: 'Kari' }] } })
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('no longer offers course initialization on Courses', () => {
    renderApp(createMemoryStorage(), '/courses')
    expect(screen.queryByRole('button', { name: 'Initialize courses' })).toBeNull()
  })
})
