import type { Storage } from '../storage/port.ts'
import type { Course, Layout, Player, Round } from './types.ts'

/** Backup file (ADR-0004). Bump CURRENT_VERSION only when this shape changes, and add a migration. */
export const BACKUP_FORMAT = 'discgolf-backup'
export const CURRENT_VERSION = 1

export interface BackupData {
  courses: Course[]
  layouts: Layout[]
  players: Player[]
  rounds: Round[]
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: number
  exportedAt: string
  data: BackupData
}

/** Everything on the device except the Active Round. */
export async function createBackup(storage: Storage, now: Date): Promise<BackupFile> {
  const [courses, layouts, players, rounds] = await Promise.all([
    storage.list('courses'),
    storage.list('layouts'),
    storage.list('players'),
    storage.list('rounds'),
  ])
  return {
    format: BACKUP_FORMAT,
    version: CURRENT_VERSION,
    exportedAt: now.toISOString(),
    data: { courses, layouts, players, rounds: rounds.filter((round) => round.finished === true) },
  }
}

const KINDS = ['courses', 'layouts', 'players', 'rounds'] as const

export type BackupErrorCode = 'notBackup' | 'newerVersion' | 'invalid'

export class BackupError extends Error {
  constructor(readonly code: BackupErrorCode, message: string = code) {
    super(message)
    this.name = 'BackupError'
  }
}

/** Upgrade steps keyed by the version they lift from: MIGRATIONS[n] turns a version n file into version n + 1. */
export type Migrations = Record<number, (file: Record<string, unknown>) => Record<string, unknown>>
export const MIGRATIONS: Migrations = {}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Lift any known older version to CURRENT_VERSION. The shape of `data` is checked afterwards. */
export function migrate(input: unknown, migrations: Migrations = MIGRATIONS): Record<string, unknown> {
  if (!isObject(input) || input.format !== BACKUP_FORMAT || !Number.isInteger(input.version)) {
    throw new BackupError('notBackup')
  }
  let file = input
  let version = file.version as number
  if (version > CURRENT_VERSION) throw new BackupError('newerVersion')
  while (version < CURRENT_VERSION) {
    const step = migrations[version]
    if (!step) throw new BackupError('notBackup', `No migration from version ${version}`)
    file = step(file)
    version++
  }
  return file
}

const isString = (v: unknown): v is string => typeof v === 'string'
const isNonEmptyString = (v: unknown): v is string => isString(v) && v.trim() !== ''
const isOptional = (v: unknown, check: (v: unknown) => boolean) => v === undefined || check(v)
const isBoolean = (v: unknown) => typeof v === 'boolean'
const isPositiveInt = (v: unknown) => Number.isInteger(v) && (v as number) > 0
/** JSON turns an undefined array slot into null; read null back as an empty slot. */
const emptySlots = <T>(values: (T | null)[]) => values.map((v) => v ?? undefined)

function invalid(message: string): never {
  throw new BackupError('invalid', message)
}

/**
 * Checks the whole file before anything is saved and returns its data with empty slots restored.
 * References must resolve in the file or on the device.
 */
async function validateBackup(file: Record<string, unknown>, storage: Storage): Promise<BackupData> {
  const data = file.data
  if (!isObject(data) || !KINDS.every((kind) => Array.isArray(data[kind]))) invalid('Expected data with courses, layouts, players, rounds')
  const records = data as Record<keyof BackupData, unknown[]>

  const ids = {} as Record<keyof BackupData, Set<string>>
  for (const kind of KINDS) {
    ids[kind] = new Set()
    for (const record of records[kind]) {
      if (!isObject(record) || !isNonEmptyString(record.id)) invalid(`${kind}: record needs an id`)
      if (ids[kind].has(record.id)) invalid(`${kind}: duplicate id ${record.id}`)
      ids[kind].add(record.id)
    }
  }
  const exists = async (kind: keyof BackupData, id: unknown) =>
    isString(id) && (ids[kind].has(id) || (await storage.get(kind, id)) !== undefined)

  const result: BackupData = { courses: [], layouts: [], players: [], rounds: [] }
  for (const course of records.courses as Record<string, unknown>[]) {
    if (!isNonEmptyString(course.name) || !isOptional(course.location, isString) || !isOptional(course.archived, isBoolean)) {
      invalid(`Course ${course.id}: invalid`)
    }
    result.courses.push(course as unknown as Course)
  }
  for (const player of records.players as Record<string, unknown>[]) {
    if (!isNonEmptyString(player.name) || !isOptional(player.archived, isBoolean)) invalid(`Player ${player.id}: invalid`)
    result.players.push(player as unknown as Player)
  }
  for (const layout of records.layouts as Record<string, unknown>[]) {
    const { pars, lengths } = layout
    if (!isNonEmptyString(layout.name) || !isOptional(layout.archived, isBoolean)
      || !Array.isArray(pars) || pars.length === 0 || !pars.every(isPositiveInt)) invalid(`Layout ${layout.id}: invalid`)
    if (lengths !== undefined && (!Array.isArray(lengths) || lengths.length !== pars.length
      || !lengths.every((l) => l === null || (typeof l === 'number' && l >= 0)))) invalid(`Layout ${layout.id}: invalid lengths`)
    if (!(await exists('courses', layout.courseId))) invalid(`Layout ${layout.id}: unknown course`)
    result.layouts.push((lengths ? { ...layout, lengths: emptySlots(lengths) } : layout) as unknown as Layout)
  }
  for (const round of records.rounds as Record<string, unknown>[]) {
    const { playerIds, scores } = round
    if (round.finished !== true) invalid(`Round ${round.id}: not finished`)
    if (!isOptional(round.date, isString) || !isOptional(round.note, isString)
      || !isOptional(playerIds, (v) => Array.isArray(v) && v.every(isString))
      || !isOptional(scores, (v) => isObject(v) && Object.values(v).every((holes) =>
        Array.isArray(holes) && holes.every((h) => h === null || isPositiveInt(h))))) invalid(`Round ${round.id}: invalid`)
    if (round.layoutId !== undefined && !(await exists('layouts', round.layoutId))) invalid(`Round ${round.id}: unknown layout`)
    const players = [...((playerIds as string[] | undefined) ?? []), ...Object.keys((scores as object | undefined) ?? {})]
    for (const id of players) if (!(await exists('players', id))) invalid(`Round ${round.id}: unknown player ${id}`)
    const restoredScores = scores && Object.fromEntries(
      Object.entries(scores as Record<string, (number | null)[]>).map(([id, holes]) => [id, emptySlots(holes)]))
    result.rounds.push((restoredScores ? { ...round, scores: restoredScores } : round) as unknown as Round)
  }
  return result
}

export type KindCounts = { added: number; updated: number; skipped: number }
export type RestoreResult = Record<keyof BackupData, KindCounts>

/** Restore (ADR-0004): merge a Backup into storage by id. Existing records are never overwritten. */
export async function restoreBackup(
  storage: Storage, input: unknown, migrations: Migrations = MIGRATIONS,
): Promise<RestoreResult> {
  const data = await validateBackup(migrate(input, migrations), storage)
  const result = {} as RestoreResult
  for (const kind of KINDS) {
    const counts: KindCounts = { added: 0, updated: 0, skipped: 0 }
    for (const record of data[kind]) {
      if (await storage.get(kind, record.id)) {
        counts.skipped++
        continue
      }
      await storage.save(kind, record)
      counts.added++
    }
    result[kind] = counts
  }
  return result
}
