import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.tsx'
import type { Storage } from '../storage/port.ts'
import { createMemoryStorage } from '../storage/memory.ts'
import { StorageProvider } from '../storage/StorageProvider.tsx'

function renderCourseDetail(storage: Storage, courseId: string) {
  return render(
    <StorageProvider storage={storage}>
      <MemoryRouter initialEntries={[`/courses/${courseId}`]}>
        <App />
      </MemoryRouter>
    </StorageProvider>,
  )
}

describe('Layout management', () => {
  it('adds a layout with per-hole pars and edits it in place while unused', async () => {
    const storage = createMemoryStorage()
    const course = await storage.save('courses', { name: 'Kivilahti' })
    renderCourseDetail(storage, course.id)

    fireEvent.click(await screen.findByRole('button', { name: 'Add layout' }))
    fireEvent.change(screen.getByLabelText('Layout name'), { target: { value: 'Short 9' } })
    fireEvent.change(screen.getByLabelText('Hole count'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add layout' }))

    // the new layout opens for editing; tapping a hole steps its par up
    fireEvent.click(await screen.findByRole('button', { name: 'Par hole 2: 3' }))
    fireEvent.click(screen.getByRole('button', { name: 'Par hole 2: 4' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save layout' }))
    await waitFor(() => {
      const layouts = storage.list('layouts').then((all) => {
        expect(all).toHaveLength(1)
        expect(all[0].pars).toEqual([3, 5, 3])
      })
      return layouts
    })
  })

  it('archives a used layout and saves edits as a new layout (ADR-0002)', async () => {
    const storage = createMemoryStorage()
    const course = await storage.save('courses', { name: 'Kivilahti' })
    const layout = await storage.save('layouts', {
      courseId: course.id,
      name: 'Championship 18',
      pars: [3, 4, 3],
    })
    await storage.save('rounds', {
      finished: true,
      layoutId: layout.id,
      playerIds: [],
    })
    renderCourseDetail(storage, course.id)

    fireEvent.click(await screen.findByRole('button', { name: /^Championship 18/ }))
    expect(screen.getByText(/This layout has rounds/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Par hole 1: 3' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save layout' }))

    await waitFor(async () => {
      const layouts = await storage.list('layouts')
      expect(layouts).toHaveLength(2)
      const old = layouts.find((l) => l.id === layout.id)!
      expect(old.pars).toEqual([3, 4, 3]) // untouched
      expect(old.archived).toBe(true)
      const fresh = layouts.find((l) => l.id !== layout.id)!
      expect(fresh.name).toBe('Championship 18') // same display name
      expect(fresh.pars).toEqual([4, 4, 3]) // edited
      expect(fresh.archived).toBe(false)
    })
  })
})
