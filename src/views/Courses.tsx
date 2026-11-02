import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Card from '@mui/material/Card'
import Drawer from '@mui/material/Drawer'
import OutlinedInput from '@mui/material/OutlinedInput'
import Typography from '@mui/material/Typography'
import { useStorage } from '../storage/useStorage.ts'
import type { Course, Layout } from '../domain/types.ts'
import { Icon } from '../components/Icon.tsx'
import { icon } from '../components/icons.tsx'

function CourseCard({ course, layoutCount }: { course: Course; layoutCount: number }) {
  const archived = Boolean(course.archived)
  const details = archived
    ? course.location
    : [course.location, `${layoutCount} ${layoutCount === 1 ? 'layout' : 'layouts'}`].filter(Boolean).join(' · ')
  return (
    <Card sx={archived ? { bgcolor: 'transparent', border: 2, borderStyle: 'dashed', borderColor: 'surface.handle' } : undefined}>
      <ButtonBase
        component={Link}
        to={`/courses/${course.id}`}
        sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.75, p: '16px 14px 16px 16px', textAlign: 'left' }}
      >
        <Box sx={{
          width: 48, height: 48, borderRadius: '16px', flex: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: archived ? 'surface.raised' : 'surface.elevated',
          color: archived ? 'text.secondary' : 'primary.main',
        }}>
          <Icon size={24}>{icon.courses}</Icon>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" component="span" noWrap sx={{ display: 'block', color: archived ? 'text.secondary' : 'text.primary' }}>
            {course.name}
          </Typography>
          {details && (
            <Typography variant="subtitle2" color="text.secondary" noWrap>{details}</Typography>
          )}
        </Box>
        <Box sx={{ color: 'text.secondary', display: 'flex' }}><Icon size={20}>{icon.chevron}</Icon></Box>
      </ButtonBase>
    </Card>
  )
}

export default function Courses() {
  const storage = useStorage()
  const [courses, setCourses] = useState<Course[]>([])
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')

  const reload = useCallback(async () => {
    const [listed, allLayouts] = await Promise.all([storage.list('courses'), storage.list('layouts')])
    setCourses(listed.sort((a, b) => a.name.localeCompare(b.name)))
    setLayouts(allLayouts)
  }, [storage])

  useEffect(() => {
    reload()
  }, [reload])

  async function addCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    await storage.save('courses', {
      name: name.trim(),
      location: location.trim() || undefined,
    })
    setName('')
    setLocation('')
    setAdding(false)
    reload()
  }

  const layoutCount = (course: Course) =>
    layouts.filter((layout) => layout.courseId === course.id && !layout.archived).length
  const active = courses.filter((course) => !course.archived)
  const archived = courses.filter((course) => course.archived)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1.5, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 1 }}>
        <div>
          <Typography variant="overline" color="text.secondary">
            {active.length} {active.length === 1 ? 'course' : 'courses'}
          </Typography>
          <Typography variant="h1" sx={{ fontSize: 34, mt: 0.5 }}>Courses</Typography>
        </div>
        <Button size="small" onClick={() => setAdding(true)} startIcon={<Icon size={20}>{icon.plus}</Icon>}
          sx={{ gap: 0.75, pl: 1.5 }}>
          Add
        </Button>
      </Box>

      {active.length === 0 && (
        <Typography variant="body2" color="text.secondary">No courses yet — add your first one</Typography>
      )}
      {active.map((course) => <CourseCard key={course.id} course={course} layoutCount={layoutCount(course)} />)}

      {archived.length > 0 && (
        <>
          <Typography variant="overline" component="h2" color="text.secondary" sx={{ mt: 1.5 }}>Archived</Typography>
          {archived.map((course) => <CourseCard key={course.id} course={course} layoutCount={layoutCount(course)} />)}
        </>
      )}

      <Drawer
        anchor="bottom"
        open={adding}
        onClose={() => setAdding(false)}
        slotProps={{ paper: { 'aria-label': 'Add course' } }}
      >
        <Box component="form" onSubmit={addCourse} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box aria-hidden="true" sx={{ width: 40, height: 4, borderRadius: '2px', bgcolor: 'surface.handle', mx: 'auto' }} />
          <Typography variant="h4" sx={{ textAlign: 'center' }}>New course</Typography>
          <OutlinedInput autoFocus placeholder="Course name" value={name}
            onChange={(e) => setName(e.target.value)} inputProps={{ 'aria-label': 'Course name' }} sx={{ height: 56 }} />
          <OutlinedInput placeholder="Location (optional)" value={location}
            onChange={(e) => setLocation(e.target.value)} inputProps={{ 'aria-label': 'Course location' }} sx={{ height: 56 }} />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" onClick={() => setAdding(false)} sx={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()} sx={{ flex: 1.4 }}>Add course</Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  )
}
