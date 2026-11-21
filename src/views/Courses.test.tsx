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

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.change(screen.getByLabelText('Course name'), { target: { value: 'Kivilahti' } })
    fireEvent.change(screen.getByLabelText('Course location'), {
      target: { value: 'Helsinki' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add course' }))
    await waitFor(() => expect(screen.getByRole('link', { name: /^Kivilahti\s*Helsinki · 0 layouts/ })).toBeTruthy())
    const courses = await storage.list('courses')
    expect(courses[0]).toMatchObject({ name: 'Kivilahti', location: 'Helsinki' })
  })

  it('renames a course from its detail view', async () => {
    const storage = createMemoryStorage()
    const course = await storage.save('courses', { name: 'Kivilahti' })
    renderCourses(storage, `/courses/${course.id}`)

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Course name'), { target: { value: 'Kivilahti DGP' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Kivilahti DGP' })).toBeTruthy())
    expect((await storage.get('courses', course.id))?.name).toBe('Kivilahti DGP')
  })

  it('archives a course that has layouts from its detail view', async () => {
    const storage = createMemoryStorage()
    const course = await storage.save('courses', { name: 'Kivilahti' })
    await storage.save('layouts', { courseId: course.id, name: 'Short 9', pars: [] })
    renderCourses(storage, `/courses/${course.id}`)

    fireEvent.click(await screen.findByRole('button', { name: 'Course menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete course' }))
    await waitFor(async () => expect((await storage.get('courses', course.id))?.archived).toBe(true))
  })

  it('lists archived courses in their own section', async () => {
    const storage = createMemoryStorage()
    await storage.save('courses', { name: 'Kivilahti', archived: true })
    renderCourses(storage)

    expect(await screen.findByRole('heading', { name: 'Archived' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /^Kivilahti/ })).toBeTruthy()
  })

  describe('search', () => {
    async function seeded() {
      const storage = createMemoryStorage()
      await storage.save('courses', { name: 'Kivilahti', location: 'Helsinki' })
      await storage.save('courses', { name: 'Oulu DGP', location: 'Oulu' })
      await storage.save('courses', { name: 'Old Park', archived: true })
      renderCourses(storage)
      await screen.findByRole('link', { name: /^Kivilahti/ })
    }
    const search = (value: string) =>
      fireEvent.change(screen.getByLabelText('Search courses'), { target: { value } })

    it('filters by name, case-insensitively', async () => {
      await seeded()
      search('kivi')
      expect(screen.getByRole('link', { name: /^Kivilahti/ })).toBeTruthy()
      expect(screen.queryByRole('link', { name: /^Oulu DGP/ })).toBeNull()
    })

    it('filters by location', async () => {
      await seeded()
      search('oulu')
      expect(screen.getByRole('link', { name: /^Oulu DGP/ })).toBeTruthy()
      expect(screen.queryByRole('link', { name: /^Kivilahti/ })).toBeNull()
    })

    it('shows empty state and hides Archived header when nothing matches', async () => {
      await seeded()
      search('zzz')
      expect(screen.getByText('No matching courses')).toBeTruthy()
      expect(screen.queryByRole('heading', { name: 'Archived' })).toBeNull()
    })

    it('filters archived courses too', async () => {
      await seeded()
      search('old')
      expect(screen.getByRole('heading', { name: 'Archived' })).toBeTruthy()
      expect(screen.getByRole('link', { name: /^Old Park/ })).toBeTruthy()
      expect(screen.queryByRole('link', { name: /^Kivilahti/ })).toBeNull()
    })

    it('clear button resets the query and disappears', async () => {
      await seeded()
      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
      search('kivi')
      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
      expect(screen.getByRole('link', { name: /^Oulu DGP/ })).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
    })
  })
})
