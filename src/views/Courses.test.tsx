import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App.tsx'
import type { Storage } from '../storage/port.ts'
import { createMemoryStorage } from '../storage/memory.ts'
import { StorageProvider } from '../storage/StorageProvider.tsx'

function renderCourses(storage: Storage, entry: string = '/courses') {
  return render(
    <StorageProvider storage={storage}>
      <MemoryRouter initialEntries={[entry]}>
        <App />
      </MemoryRouter>
    </StorageProvider>,
  )
}

describe('Courses', () => {
  it('creates a course with name and optional location and lists it', async () => {
    const storage = createMemoryStorage()
    renderCourses(storage)

    fireEvent.change(screen.getByLabelText('Course name'), { target: { value: 'Kivilahti' } })
    fireEvent.change(screen.getByLabelText('Course location'), {
      target: { value: 'Helsinki' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(screen.getByRole('link', { name: 'Kivilahti' })).toBeTruthy())
    const courses = await storage.list('courses')
    expect(courses[0]).toMatchObject({ name: 'Kivilahti', location: 'Helsinki' })
  })

  it('renames a course from its detail view', async () => {
    const storage = createMemoryStorage()
    const course = await storage.save('courses', { name: 'Kivilahti' })
    renderCourses(storage, `/courses/${course.id}`)

    await waitFor(() => expect(screen.getByLabelText('Course name')).toBeTruthy())
    fireEvent.change(screen.getByLabelText('Course name'), { target: { value: 'Kivilahti DGP' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Kivilahti DGP' })).toBeTruthy())
    expect((await storage.get('courses', course.id))?.name).toBe('Kivilahti DGP')
  })

  it('deletes an unreferenced course and archives one with layouts', async () => {
    const storage = createMemoryStorage()
    const course = await storage.save('courses', { name: 'Kivilahti' })
    await storage.save('layouts', { courseId: course.id, name: 'Short 9', pars: [] })
    renderCourses(storage)

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Kivilahti' })).toBeTruthy(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.getByText('(archived)')).toBeTruthy())
    expect((await storage.get('courses', course.id))?.archived).toBe(true)
  })
})
