import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Card from '@mui/material/Card'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Typography from '@mui/material/Typography'
import { useStorage } from '../storage/useStorage.ts'
import { courseIsReferenced, layoutIsReferenced } from '../domain/records.ts'
import type { Course, Layout, Round } from '../domain/types.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { Icon } from '../components/Icon.tsx'
import { icon } from '../components/icons.tsx'

/** Par change when adding holes; standard mid-adjustment default. */
const DEFAULT_PAR = 3
const MIN_PAR = 2
const MAX_PAR = 6

const parTotal = (pars: number[]) => pars.reduce((sum, par) => sum + par, 0)

function Sheet({ open, label, onClose, onSubmit, children }: {
  open: boolean
  label: string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
}) {
  return (
    <Drawer anchor="bottom" open={open} onClose={onClose} slotProps={{ paper: { 'aria-label': label } }}>
      <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box aria-hidden="true" sx={{ width: 40, height: 4, borderRadius: '2px', bgcolor: 'surface.handle', mx: 'auto' }} />
        <Typography variant="h4" sx={{ textAlign: 'center' }}>{label}</Typography>
        {children}
      </Box>
    </Drawer>
  )
}

function LayoutEditor({ layout, used, onDone, onDelete }: {
  layout: Layout
  used: boolean
  onDone: () => void
  onDelete: () => void
}) {
  const storage = useStorage()
  const { t } = useI18n()
  const [name, setName] = useState(layout.name)
  const [pars, setPars] = useState<number[]>(layout.pars)
  const [changed, setChanged] = useState<number | null>(null)
  const [lengthText, setLengthText] = useState<string[]>(() => pars.map((_, i) => String(layout.lengths?.[i] ?? '')))

  async function save() {
    if (!name.trim()) return
    const lengths = lengthText.map((text) => Number(text) || undefined)
    const parsChanged = pars.some((par, i) => par !== layout.pars[i])
    // ADR-0002: a used Layout's pars cannot change; editing them yields a new
    // Layout with the same name and archives the old one. Lengths are exempt.
    if (used && parsChanged) {
      await storage.save('layouts', { ...layout, archived: true })
      await storage.save('layouts', {
        courseId: layout.courseId,
        name: layout.name,
        pars,
        lengths,
        archived: false,
      })
    } else if (used) {
      await storage.save('layouts', { ...layout, lengths })
    } else {
      await storage.save('layouts', { ...layout, name: name.trim(), pars, lengths })
    }
    onDone()
  }

  function bump(index: number) {
    setPars((prev) => prev.map((par, i) => (i === index ? (par >= MAX_PAR ? MIN_PAR : par + 1) : par)))
    setChanged(index)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 2, pb: 2 }}>
      {!used && (
        <OutlinedInput value={name} onChange={(e) => setName(e.target.value)}
          inputProps={{ 'aria-label': t.courseDetail.layoutName }} sx={{ height: 48 }} />
      )}
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {t.courseDetail.tapToChange} · <Box component="span" sx={{ color: 'primary.main' }}>{t.common.par(parTotal(pars))}</Box>
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {pars.map((par, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography component="span" sx={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'text.secondary' }}>
              {t.courseDetail.holeLabel(index + 1)}
            </Typography>
            <ButtonBase
              aria-label={t.courseDetail.parHole(index + 1, par)}
              onClick={() => bump(index)}
              sx={{
                width: 52, height: 40, borderRadius: '14px', border: 2,
                borderColor: index === changed ? 'primary.main' : 'surface.elevated', bgcolor: 'surface.elevated',
              }}
            >
              <Typography component="span" sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{par}</Typography>
            </ButtonBase>
            <OutlinedInput
              value={lengthText[index]}
              onChange={(e) => setLengthText((prev) => prev.map((text, i) => (i === index ? e.target.value.replace(/\D/g, '').slice(0, 3) : text)))}
              inputProps={{ 'aria-label': t.courseDetail.lengthHole(index + 1), inputMode: 'numeric' }}
              endAdornment={<Typography component="span" variant="caption" color="text.secondary">{t.courseDetail.meters}</Typography>}
              sx={{ width: 96, height: 40 }}
            />
          </Box>
        ))}
      </Box>
      {used && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', p: '10px 12px', borderRadius: '14px', bgcolor: 'surface.elevated' }}>
          <Box sx={{ color: 'warning.main', display: 'flex', flex: 'none', mt: '1px' }}>
            <Icon size={16}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></Icon>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t.courseDetail.usedNotice(layout.name)}
          </Typography>
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button size="small" variant="outlined" onClick={onDelete} sx={{ flex: 1 }}>{t.courseDetail.deleteLayout}</Button>
        <Button size="small" onClick={save} sx={{ flex: 1.4 }}>{t.courseDetail.saveLayout}</Button>
      </Box>
    </Box>
  )
}

export default function CourseDetail() {
  const { courseId } = useParams()
  const { t } = useI18n()
  const storage = useStorage()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [newLayoutName, setNewLayoutName] = useState('')
  const [newLayoutHoles, setNewLayoutHoles] = useState(9)
  const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null)
  const [sheet, setSheet] = useState<'course' | 'layout' | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  const reload = useCallback(async () => {
    const [found, allLayouts, allRounds] = await Promise.all([
      storage.get('courses', courseId ?? ''),
      storage.list('layouts'),
      storage.list('rounds'),
    ])
    setCourse(found ?? null)
    setLayouts(allLayouts.filter((l) => l.courseId === courseId))
    setRounds(allRounds)
    setName(found?.name ?? '')
    setLocation(found?.location ?? '')
  }, [storage, courseId])

  useEffect(() => {
    reload()
  }, [reload])

  if (!course) return null

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    await storage.save('courses', {
      ...course,
      name: name.trim(),
      location: location.trim() || undefined,
    })
    setSheet(null)
    reload()
  }

  async function addLayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newLayoutName.trim()) return
    const created = await storage.save('layouts', {
      courseId,
      name: newLayoutName.trim(),
      pars: Array(newLayoutHoles).fill(DEFAULT_PAR),
    })
    setNewLayoutName('')
    setNewLayoutHoles(9)
    setEditingLayoutId(created.id)
    setSheet(null)
    reload()
  }

  async function removeLayout(layout: Layout) {
    if (layoutIsReferenced(rounds, layout.id)) {
      await storage.save('layouts', { ...layout, archived: true })
    } else {
      await storage.delete('layouts', layout.id)
    }
    setEditingLayoutId(null)
    reload()
  }

  async function remove() {
    setMenuAnchor(null)
    if (!course) return
    const allLayouts = await storage.list('layouts')
    if (courseIsReferenced(allLayouts, rounds, course.id)) {
      await storage.save('courses', { ...course, archived: true })
    } else {
      await storage.delete('courses', course.id)
    }
    navigate('/courses')
  }

  const active = layouts.filter((layout) => !layout.archived)
  const archived = layouts.filter((layout) => layout.archived)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5, pb: 1 }}>
        <IconButton component={Link} to="/courses" aria-label={t.courseDetail.backToCourses}>
          <Icon>{icon.back}</Icon>
        </IconButton>
        <IconButton aria-label={t.courseDetail.courseMenu} onClick={(e) => setMenuAnchor(e.currentTarget)}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
          </svg>
        </IconButton>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={remove}>{t.courseDetail.deleteCourse}</MenuItem>
        </Menu>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h1" sx={{ fontSize: 30, lineHeight: 1.1 }}>{course.name}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>
            {[course.location, course.archived && t.common.archived].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
        <Button size="small" variant="outlined" onClick={() => setSheet('course')}
          startIcon={<Icon size={16}>{icon.edit}</Icon>} sx={{ gap: 0.75, flex: 'none' }}>
          {t.courseDetail.edit}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
        <Typography variant="h4" component="h2">{t.courseDetail.layoutsHeading}</Typography>
        <Button size="small" onClick={() => setSheet('layout')} startIcon={<Icon size={18}>{icon.plus}</Icon>}
          sx={{ gap: 0.75, pl: 1.25, bgcolor: 'surface.elevated', color: 'primary.main', '&:hover': { bgcolor: 'surface.track' } }}>
          {t.courseDetail.addLayout}
        </Button>
      </Box>

      {active.length === 0 && (
        <Typography variant="body2" color="text.secondary">{t.courseDetail.noLayouts}</Typography>
      )}
      {active.map((layout) => {
        const open = editingLayoutId === layout.id
        return (
          <Card key={layout.id}>
            <ButtonBase
              aria-expanded={open}
              onClick={() => setEditingLayoutId(open ? null : layout.id)}
              sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, p: '14px 16px', textAlign: 'left' }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h5" component="span" noWrap sx={{ display: 'block' }}>{layout.name}</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {t.courseDetail.holesPar(layout.pars.length, parTotal(layout.pars))}
                </Typography>
              </Box>
              <Box sx={{ color: 'text.secondary', display: 'flex', transform: open ? 'rotate(-90deg)' : 'rotate(90deg)' }}>
                <Icon size={20}>{icon.chevron}</Icon>
              </Box>
            </ButtonBase>
            {open && (
              <LayoutEditor
                key={layout.id}
                layout={layout}
                used={layoutIsReferenced(rounds, layout.id)}
                onDone={() => { setEditingLayoutId(null); reload() }}
                onDelete={() => removeLayout(layout)}
              />
            )}
          </Card>
        )
      })}

      {archived.map((layout) => (
        <Box key={layout.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '12px 16px', borderRadius: 6, border: 2, borderStyle: 'dashed', borderColor: 'surface.handle' }}>
          <Typography variant="subtitle1" color="text.secondary" sx={{ flex: 1, fontWeight: 700 }}>
            {layout.name} <Box component="span" sx={{ fontWeight: 600 }}>· {t.common.par(parTotal(layout.pars))}</Box>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: 'surface.elevated', fontWeight: 700 }}>
            {t.common.archived}
          </Typography>
        </Box>
      ))}

      <Sheet open={sheet === 'course'} label={t.courseDetail.editCourse} onClose={() => setSheet(null)} onSubmit={save}>
        <OutlinedInput value={name} placeholder={t.courses.courseName} onChange={(e) => setName(e.target.value)}
          inputProps={{ 'aria-label': t.courses.courseName }} sx={{ height: 56 }} />
        <OutlinedInput value={location} placeholder={t.courses.locationOptional} onChange={(e) => setLocation(e.target.value)}
          inputProps={{ 'aria-label': t.courses.courseLocation }} sx={{ height: 56 }} />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => setSheet(null)} sx={{ flex: 1 }}>{t.common.cancel}</Button>
          <Button type="submit" disabled={!name.trim()} sx={{ flex: 1.4 }}>{t.common.save}</Button>
        </Box>
      </Sheet>

      <Sheet open={sheet === 'layout'} label={t.courseDetail.newLayout} onClose={() => setSheet(null)} onSubmit={addLayout}>
        <OutlinedInput autoFocus value={newLayoutName} placeholder={t.courseDetail.layoutName} onChange={(e) => setNewLayoutName(e.target.value)}
          inputProps={{ 'aria-label': t.courseDetail.layoutName }} sx={{ height: 56 }} />
        <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="subtitle1" sx={{ flex: 1 }}>{t.courseDetail.holes}</Typography>
          <OutlinedInput type="number" value={newLayoutHoles} onChange={(e) => setNewLayoutHoles(Math.max(1, Number(e.target.value)))}
            inputProps={{ min: 1, 'aria-label': t.courseDetail.holeCount }} sx={{ height: 56, width: 110 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => setSheet(null)} sx={{ flex: 1 }}>{t.common.cancel}</Button>
          <Button type="submit" disabled={!newLayoutName.trim()} sx={{ flex: 1.4 }}>{t.courseDetail.addLayout}</Button>
        </Box>
      </Sheet>
    </Box>
  )
}
