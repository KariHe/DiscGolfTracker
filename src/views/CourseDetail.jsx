import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useStorage } from '../storage/useStorage.js'
import { courseIsReferenced, layoutIsReferenced } from '../domain/records.js'

/** Par change when adding holes; standard mid-adjustment default. */
const DEFAULT_PAR = 3

function LayoutEditor({ layout, onDone }) {
  const storage = useStorage()
  const [name, setName] = useState(layout.name)
  const [pars, setPars] = useState(layout.pars)
  const [error, setError] = useState(null)

  async function save(event) {
    event.preventDefault()
    if (!name.trim()) return
    const rounds = await storage.list('rounds')
    const frozen = layoutIsReferenced(rounds, layout.id)
    // ADR-0002: a used Layout cannot change; editing yields a new Layout
    // with the same name and archives the old one
    if (frozen) {
      await storage.save('layouts', { ...layout, archived: true })
      await storage.save('layouts', {
        courseId: layout.courseId,
        name: layout.name,
        pars,
        archived: false,
      })
      setError(
        'Layout already has rounds — saved as a new layout and archived the old one',
      )
      onDone(true)
      return
    }
    await storage.save('layouts', { ...layout, name: name.trim(), pars })
    onDone(false)
  }

  function setPar(index, value) {
    setPars((prev) => prev.map((par, i) => (i === index ? Math.max(1, value) : par)))
  }

  return (
    <form onSubmit={save}>
      <input value={name} aria-label="Layout name" onChange={(e) => setName(e.target.value)} />
      <ol>
        {pars.map((par, index) => (
          <li key={index}>
            <input
              type="number"
              min="1"
              value={par}
              aria-label={`Par hole ${index + 1}`}
              onChange={(e) => setPar(index, Number(e.target.value))}
            />
          </li>
        ))}
      </ol>
      {error && <p>{error}</p>}
      <button type="submit">Save layout</button>
    </form>
  )
}

export default function CourseDetail() {
  const { courseId } = useParams()
  const storage = useStorage()
  const [course, setCourse] = useState(null)
  const [layouts, setLayouts] = useState([])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [newLayoutName, setNewLayoutName] = useState('')
  const [newLayoutHoles, setNewLayoutHoles] = useState(9)
  const [editingLayoutId, setEditingLayoutId] = useState(null)

  const reload = useCallback(async () => {
    const [found, allLayouts] = await Promise.all([
      storage.get('courses', courseId),
      storage.list('layouts'),
    ])
    setCourse(found)
    setLayouts(allLayouts.filter((l) => l.courseId === courseId))
    setName(found?.name ?? '')
    setLocation(found?.location ?? '')
  }, [storage, courseId])

  useEffect(() => {
    reload()
  }, [reload])

  if (!course) return null

  async function save(event) {
    event.preventDefault()
    await storage.save('courses', {
      ...course,
      name: name.trim(),
      location: location.trim() || undefined,
    })
    reload()
  }

  async function addLayout(event) {
    event.preventDefault()
    if (!newLayoutName.trim()) return
    await storage.save('layouts', {
      courseId,
      name: newLayoutName.trim(),
      pars: Array(newLayoutHoles).fill(DEFAULT_PAR),
    })
    setNewLayoutName('')
    setNewLayoutHoles(9)
    setEditingLayoutId(null)
    reload()
  }

  async function removeLayout(layout) {
    const rounds = await storage.list('rounds')
    if (layoutIsReferenced(rounds, layout.id)) {
      await storage.save('layouts', { ...layout, archived: true })
    } else {
      await storage.delete('layouts', layout.id)
    }
    reload()
  }

  async function remove() {
    const [allLayouts, rounds] = await Promise.all([
      storage.list('layouts'),
      storage.list('rounds'),
    ])
    const referenced = courseIsReferenced(allLayouts, rounds, course.id)
    if (referenced) {
      await storage.save('courses', { ...course, archived: true })
    } else {
      await storage.delete('courses', course.id)
    }
    window.history.back()
  }

  return (
    <>
      <h1>
        {course.name}
        {course.archived && <span> (archived)</span>}
      </h1>
      <form onSubmit={save}>
        <input value={name} aria-label="Course name" onChange={(e) => setName(e.target.value)} />
        <input
          value={location}
          placeholder="Location"
          aria-label="Course location"
          onChange={(e) => setLocation(e.target.value)}
        />
        <button type="submit">Save</button>
      </form>
      <button onClick={remove}>Delete</button>

      <h2>Layouts</h2>
      <form onSubmit={addLayout}>
        <input
          value={newLayoutName}
          placeholder="Layout name"
          aria-label="Layout name"
          onChange={(e) => setNewLayoutName(e.target.value)}
        />
        <input
          type="number"
          min="1"
          value={newLayoutHoles}
          aria-label="Hole count"
          onChange={(e) => setNewLayoutHoles(Number(e.target.value))}
        />
        <button type="submit">Add layout</button>
      </form>
      <ul>
        {layouts.length === 0 && <li>No layouts yet</li>}
        {layouts.map((layout) => (
          <li key={layout.id}>
            {layout.name} — {layout.pars.length} holes (par{' '}
            {layout.pars.reduce((sum, par) => sum + par, 0)})
            {layout.archived && <span> (archived)</span>}
            {layout.archived ? null : (
              <>
                <button
                  onClick={() => setEditingLayoutId(editingLayoutId === layout.id ? null : layout.id)}
                >
                  {editingLayoutId === layout.id ? 'Close' : 'Edit'}
                </button>
                <button onClick={() => removeLayout(layout)}>Delete</button>
                {editingLayoutId === layout.id && (
                  <LayoutEditor
                    layout={layout}
                    onDone={() => {
                      reload()
                    }}
                  />
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      <Link to="/courses">Back</Link>
    </>
  )
}
