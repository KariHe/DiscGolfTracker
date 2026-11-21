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
