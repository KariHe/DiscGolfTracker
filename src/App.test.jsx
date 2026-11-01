import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StorageProvider } from './storage/StorageProvider.jsx'
import { createMemoryStorage } from './storage/memory.js'
import App from './App.jsx'

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
    expect(screen.getByRole('heading', { name: 'Home' })).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Courses' }))
    expect(screen.getByRole('heading', { name: 'Courses' })).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Players' }))
    expect(screen.getByRole('heading', { name: 'Players' })).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'History' }))
    expect(screen.getByRole('heading', { name: 'History' })).toBeTruthy()
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
