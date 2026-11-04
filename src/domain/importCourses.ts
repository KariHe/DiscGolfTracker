import type { Storage } from '../storage/port.ts'

export interface ImportData {
  courses: { id: string; name: string; location?: string }[]
  layouts: { id: string; courseId: string; name: string; pars: number[]; lengths?: (number | null)[] }[]
}

export interface ImportResult {
  courses: number
  layouts: number
  lengthsUpdated: number
  skipped: number
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isNonEmptyString = (v: unknown) => typeof v === 'string' && v.trim() !== ''

/** Throws on any structural problem; nothing is saved before this passes. */
export function validateImportData(input: unknown): asserts input is ImportData {
  if (!isObject(input) || !Array.isArray(input.courses) || !Array.isArray(input.layouts)) {
    throw new Error('Expected { courses: [], layouts: [] }')
  }
  const courseIds = new Set<string>()
  for (const course of input.courses) {
    if (!isObject(course) || !isNonEmptyString(course.id) || !isNonEmptyString(course.name)) {
      throw new Error('Course needs id and name')
    }
    if (courseIds.has(course.id as string)) throw new Error(`Duplicate course id ${course.id}`)
    courseIds.add(course.id as string)
  }
  const layoutIds = new Set<string>()
  for (const layout of input.layouts) {
    if (!isObject(layout) || !isNonEmptyString(layout.id) || !isNonEmptyString(layout.name)) {
      throw new Error('Layout needs id and name')
    }
    const id = layout.id as string
    if (layoutIds.has(id)) throw new Error(`Duplicate layout id ${id}`)
    layoutIds.add(id)
    if (typeof layout.courseId !== 'string' || !courseIds.has(layout.courseId)) {
      throw new Error(`Layout ${id}: unknown course`)
    }
    const { pars, lengths } = layout
    if (!Array.isArray(pars) || pars.length === 0 || !pars.every((p) => Number.isInteger(p) && p > 0)) {
      throw new Error(`Layout ${id}: invalid pars`)
    }
    if (lengths !== undefined) {
      if (!Array.isArray(lengths) || lengths.length !== pars.length
        || !lengths.every((l) => l === null || (typeof l === 'number' && l >= 0))) {
        throw new Error(`Layout ${id}: invalid lengths`)
      }
    }
  }
}

/**
 * Additive import: existing courses are never overwritten; existing layouts keep their
 * pars (ADR-0002) and only get lengths filled in. Archived records are left alone.
 */
export async function importCourses(storage: Storage, input: unknown): Promise<ImportResult> {
  validateImportData(input)
  const result: ImportResult = { courses: 0, layouts: 0, lengthsUpdated: 0, skipped: 0 }
  const skippedCourseIds = new Set<string>()

  for (const course of input.courses) {
    const existing = await storage.get('courses', course.id)
    if (existing) {
      result.skipped++
      if (existing.archived) skippedCourseIds.add(course.id)
      continue
    }
    await storage.save('courses', { id: course.id, name: course.name, location: course.location })
    result.courses++
  }

  for (const layout of input.layouts) {
    if (skippedCourseIds.has(layout.courseId)) {
      result.skipped++
      continue
    }
    const lengths = layout.lengths?.map((l) => l ?? undefined)
    const existing = await storage.get('layouts', layout.id)
    if (!existing) {
      await storage.save('layouts', {
        id: layout.id, courseId: layout.courseId, name: layout.name, pars: layout.pars, lengths,
      })
      result.layouts++
      continue
    }
    if (existing.archived || !lengths || existing.pars.length !== layout.pars.length) {
      result.skipped++
      continue
    }
    const merged = lengths.map((l, i) => l ?? existing.lengths?.[i])
    const same = merged.every((l, i) => l === existing.lengths?.[i])
    if (same) {
      result.skipped++
      continue
    }
    await storage.save('layouts', { ...existing, lengths: merged })
    result.lengthsUpdated++
  }
  return result
}
