import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.jsx'
import { createMemoryStorage } from '../storage/memory.js'
import { StorageProvider } from '../storage/StorageProvider.jsx'

function renderPlayers(storage) {
  return render(
    <StorageProvider storage={storage}>
      <MemoryRouter initialEntries={['/players']}>
        <App />
      </MemoryRouter>
    </StorageProvider>,
  )
}

describe('Players', () => {
  it('adds a player, renames, archives when referenced, deletes when not', async () => {
    const storage = createMemoryStorage()
    renderPlayers(storage)

    fireEvent.change(screen.getByLabelText('Player name'), { target: { value: 'Nadja' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(screen.getByText('Nadja')).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Edit player name'), { target: { value: 'Nadja P.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('Nadja P.')).toBeTruthy())

    // unreferenced: hard delete
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.queryByText('Nadja P.')).toBeNull())
    expect(await storage.list('players')).toHaveLength(0)
  })

  it('archives instead of deleting a player that a round references', async () => {
    const storage = createMemoryStorage()
    const player = await storage.save('players', { name: 'Kari' })
    await storage.save('rounds', { finished: true, playerIds: [player.id] })
    renderPlayers(storage)

    await waitFor(() => expect(screen.getByText('Kari')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.getByText('Kari')).toBeTruthy())
    const players = await storage.list('players')
    expect(players[0].archived).toBe(true)
  })
})
