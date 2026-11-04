import { createMemoryStorage } from '../storage/memory.ts'
import bundled from '../data/southern-finland-courses.json'
import { importCourses, validateImportData } from './importCourses.ts'

const data = () => ({
  courses: [{ id: 'c1', name: 'Course 1', location: 'Espoo' }],
  layouts: [{ id: 'c1-1', courseId: 'c1', name: 'Main', pars: [3, 4, 3], lengths: [60, null, 80] }],
})

describe('validateImportData', () => {
  it('accepts the bundled file', () => {
    expect(() => validateImportData(bundled)).not.toThrow()
  })

  it.each([
    ['not an object', 'x'],
    ['missing layouts', { courses: [] }],
    ['duplicate course ids', { courses: [{ id: 'a', name: 'A' }, { id: 'a', name: 'B' }], layouts: [] }],
    ['course without name', { courses: [{ id: 'a' }], layouts: [] }],
    ['layout with unknown course', { courses: [], layouts: [{ id: 'l', courseId: 'x', name: 'L', pars: [3] }] }],
    ['layout with empty pars', { courses: [{ id: 'a', name: 'A' }], layouts: [{ id: 'l', courseId: 'a', name: 'L', pars: [] }] }],
    ['layout with bad par', { courses: [{ id: 'a', name: 'A' }], layouts: [{ id: 'l', courseId: 'a', name: 'L', pars: [3, 0] }] }],
    ['lengths count mismatch', { courses: [{ id: 'a', name: 'A' }], layouts: [{ id: 'l', courseId: 'a', name: 'L', pars: [3, 3], lengths: [50] }] }],
    ['duplicate layout ids', { courses: [{ id: 'a', name: 'A' }], layouts: [{ id: 'l', courseId: 'a', name: 'L', pars: [3] }, { id: 'l', courseId: 'a', name: 'M', pars: [3] }] }],
  ])('rejects %s', (_label, input) => {
    expect(() => validateImportData(input)).toThrow()
  })
})

describe('importCourses', () => {
  it('saves new courses and layouts with file ids, null lengths become undefined', async () => {
    const storage = createMemoryStorage()
    const result = await importCourses(storage, data())
    expect(result).toEqual({ courses: 1, layouts: 1, lengthsUpdated: 0, skipped: 0 })
    expect(await storage.get('courses', 'c1')).toMatchObject({ name: 'Course 1', location: 'Espoo' })
    const layout = await storage.get('layouts', 'c1-1')
    expect(layout?.pars).toEqual([3, 4, 3])
    expect(layout?.lengths).toEqual([60, undefined, 80])
  })

  it('is idempotent: second run skips everything', async () => {
    const storage = createMemoryStorage()
    await importCourses(storage, data())
    const result = await importCourses(storage, data())
    expect(result).toEqual({ courses: 0, layouts: 0, lengthsUpdated: 0, skipped: 2 })
  })

  it('does not overwrite an existing course', async () => {
    const storage = createMemoryStorage()
    await storage.save('courses', { id: 'c1', name: 'Renamed' })
    await importCourses(storage, data())
    expect((await storage.get('courses', 'c1'))?.name).toBe('Renamed')
  })

  it('never changes pars of an existing layout but updates lengths, keeping existing where file has null', async () => {
    const storage = createMemoryStorage()
    await storage.save('courses', { id: 'c1', name: 'Course 1' })
    await storage.save('layouts', { id: 'c1-1', courseId: 'c1', name: 'Mine', pars: [3, 3, 3], lengths: [1, 2, 3] })
    const result = await importCourses(storage, data())
    const layout = await storage.get('layouts', 'c1-1')
    expect(layout).toMatchObject({ name: 'Mine', pars: [3, 3, 3], lengths: [60, 2, 80] })
    expect(result).toMatchObject({ lengthsUpdated: 1, layouts: 0 })
  })

  it('skips length update when hole count differs', async () => {
    const storage = createMemoryStorage()
    await storage.save('courses', { id: 'c1', name: 'Course 1' })
    await storage.save('layouts', { id: 'c1-1', courseId: 'c1', name: 'Mine', pars: [3, 3], lengths: [1, 2] })
    const result = await importCourses(storage, data())
    expect((await storage.get('layouts', 'c1-1'))?.lengths).toEqual([1, 2])
    expect(result).toMatchObject({ lengthsUpdated: 0, skipped: 2 })
  })

  it('skips archived layouts', async () => {
    const storage = createMemoryStorage()
    await storage.save('courses', { id: 'c1', name: 'Course 1' })
    await storage.save('layouts', { id: 'c1-1', courseId: 'c1', name: 'Old', pars: [3, 4, 3], lengths: [1, 2, 3], archived: true })
    await importCourses(storage, data())
    expect((await storage.get('layouts', 'c1-1'))?.lengths).toEqual([1, 2, 3])
  })

  it('skips an archived course and its file layouts', async () => {
    const storage = createMemoryStorage()
    await storage.save('courses', { id: 'c1', name: 'Course 1', archived: true })
    const result = await importCourses(storage, data())
    expect(await storage.get('layouts', 'c1-1')).toBeUndefined()
    expect(result).toEqual({ courses: 0, layouts: 0, lengthsUpdated: 0, skipped: 2 })
  })

  it('saves nothing when the file is invalid', async () => {
    const storage = createMemoryStorage()
    await expect(importCourses(storage, { courses: [{ id: 'a' }], layouts: [] })).rejects.toThrow()
    expect(await storage.list('courses')).toEqual([])
  })
})
