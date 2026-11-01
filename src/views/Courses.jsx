import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useStorage } from '../storage/useStorage.js'
import { courseIsReferenced } from '../domain/records.js'

export default function Courses() {
  const storage = useStorage()
  const [courses, setCourses] = useState([])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')

  const reload = useCallback(async () => {
    const listed = await storage.list('courses')
    setCourses(listed.sort((a, b) => a.name.localeCompare(b.name)))
  }, [storage])

  useEffect(() => {
    reload()
  }, [reload])

  async function addCourse(event) {
    event.preventDefault()
    if (!name.trim()) return
    await storage.save('courses', {
      name: name.trim(),
      location: location.trim() || undefined,
    })
    setName('')
    setLocation('')
    reload()
  }

  async function remove(course) {
    const [layouts, rounds] = await Promise.all([
      storage.list('layouts'),
      storage.list('rounds'),
    ])
    const referenced = courseIsReferenced(layouts, rounds, course.id)
    if (referenced) {
      await storage.save('courses', { ...course, archived: true })
    } else {
      await storage.delete('courses', course.id)
    }
    reload()
  }

  return (
    <>
      <h1>Courses</h1>
      <form onSubmit={addCourse}>
        <input
          value={name}
          placeholder="Course name"
          aria-label="Course name"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          value={location}
          placeholder="Location"
          aria-label="Course location"
          onChange={(e) => setLocation(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {courses.map((course) => (
          <li key={course.id}>
            <Link to={`/courses/${course.id}`}>{course.name}</Link>
            {course.location && <span> — {course.location}</span>}
            {course.archived && <span> (archived)</span>}
            <button onClick={() => remove(course)}>Delete</button>
          </li>
        ))}
      </ul>
    </>
  )
}
