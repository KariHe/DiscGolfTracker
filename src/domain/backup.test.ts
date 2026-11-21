import { createMemoryStorage } from '../storage/memory.ts'
import { createBackup } from './backup.ts'

const NOW = new Date('2026-11-21T10:00:00.000Z')

describe('createBackup', () => {
  it('holds every course, layout, player and finished round, archived included, but not the Active Round', async () => {
    const storage = createMemoryStorage()
    await storage.save('courses', { id: 'c1', name: 'Kivilahti', location: 'Helsinki' })
    await storage.save('courses', { id: 'c2', name: 'Old', archived: true })
    await storage.save('layouts', { id: 'l1', courseId: 'c1', name: 'Short', pars: [3, 3] })
    await storage.save('players', { id: 'p1', name: 'Kari' })
    await storage.save('players', { id: 'p2', name: 'Gone', archived: true })
    await storage.save('rounds', {
      id: 'r1', date: '2026-11-01', layoutId: 'l1', playerIds: ['p1'], scores: { p1: [3, 4] }, finished: true,
    })
    await storage.save('rounds', { id: 'r2', date: '2026-11-21', layoutId: 'l1', playerIds: ['p1'], finished: false })

    const backup = await createBackup(storage, NOW)

    expect(backup.format).toBe('discgolf-backup')
    expect(backup.version).toBe(1)
    expect(backup.exportedAt).toBe('2026-11-21T10:00:00.000Z')
    expect(backup.data.courses.map((c) => c.id).sort()).toEqual(['c1', 'c2'])
    expect(backup.data.layouts).toEqual([{ id: 'l1', courseId: 'c1', name: 'Short', pars: [3, 3] }])
    expect(backup.data.players.map((p) => p.id).sort()).toEqual(['p1', 'p2'])
    expect(backup.data.rounds.map((r) => r.id)).toEqual(['r1'])
  })

  it('is plain JSON', async () => {
    const storage = createMemoryStorage()
    await storage.save('courses', { id: 'c1', name: 'Kivilahti' })
    const backup = await createBackup(storage, NOW)
    expect(JSON.parse(JSON.stringify(backup))).toEqual(backup)
  })
})
