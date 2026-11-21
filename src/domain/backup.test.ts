import { createMemoryStorage } from '../storage/memory.ts'
import type { Storage } from '../storage/port.ts'
import { BackupError, createBackup, restoreBackup } from './backup.ts'

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

async function seeded() {
  const storage = createMemoryStorage()
  await storage.save('courses', { id: 'c1', name: 'Kivilahti', location: 'Helsinki' })
  await storage.save('courses', { id: 'c2', name: 'Old', archived: true })
  await storage.save('layouts', { id: 'l1', courseId: 'c1', name: 'Short', pars: [3, 3], lengths: [60, undefined] })
  await storage.save('players', { id: 'p1', name: 'Kari' })
  await storage.save('players', { id: 'p2', name: 'Nadja' })
  await storage.save('rounds', {
    id: 'r1', date: '2026-11-01', layoutId: 'l1', playerIds: ['p1', 'p2'], scores: { p1: [3, 4], p2: [2, 3] }, finished: true, note: 'Windy',
  })
  return storage
}

const contents = async (storage: Storage) => ({
  courses: await storage.list('courses'),
  layouts: await storage.list('layouts'),
  players: await storage.list('players'),
  rounds: await storage.list('rounds'),
})

describe('restoreBackup', () => {
  it('reproduces every record in empty storage and reports them added', async () => {
    const source = await seeded()
    const file = JSON.parse(JSON.stringify(await createBackup(source, NOW)))
    const target = createMemoryStorage()

    const result = await restoreBackup(target, file)

    const asJson = (value: unknown) => JSON.parse(JSON.stringify(value))
    expect(asJson(await contents(target))).toEqual(asJson(await contents(source)))
    expect(result).toEqual({
      courses: { added: 2, updated: 0, skipped: 0 },
      layouts: { added: 1, updated: 0, skipped: 0 },
      players: { added: 2, updated: 0, skipped: 0 },
      rounds: { added: 1, updated: 0, skipped: 0 },
    })
  })
  it('restoring the same file again changes nothing', async () => {
    const file = JSON.parse(JSON.stringify(await createBackup(await seeded(), NOW)))
    const target = createMemoryStorage()
    await restoreBackup(target, file)
    const before = await contents(target)

    const result = await restoreBackup(target, file)

    expect(await contents(target)).toEqual(before)
    expect(Object.values(result).every((c) => c.added === 0 && c.updated === 0)).toBe(true)
  })

  it('runs migrations to lift an older version before restoring', async () => {
    const v0 = { format: 'discgolf-backup', version: 0, exportedAt: NOW.toISOString(), people: [{ id: 'p1', name: 'Kari' }] }
    const target = createMemoryStorage()

    await restoreBackup(target, v0, {
      0: ({ people, ...rest }) => ({ ...rest, version: 1, data: { courses: [], layouts: [], players: people, rounds: [] } }),
    })

    expect(await target.list('players')).toEqual([{ id: 'p1', name: 'Kari' }])
  })

  describe('rejects the whole file and saves nothing', () => {
    async function expectRejected(file: unknown, code: string) {
      const target = createMemoryStorage()
      const error = await restoreBackup(target, file).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(BackupError)
      expect((error as BackupError).code).toBe(code)
      expect(await contents(target)).toEqual({ courses: [], layouts: [], players: [], rounds: [] })
    }
    const valid = async () => JSON.parse(JSON.stringify(await createBackup(await seeded(), NOW)))

    it('when it is not a Backup file', async () => {
      await expectRejected({ courses: [], layouts: [] }, 'notBackup')
      await expectRejected('nope', 'notBackup')
      await expectRejected({ ...(await valid()), version: '1' }, 'notBackup')
    })

    it('when it comes from a newer app version', async () => {
      await expectRejected({ ...(await valid()), version: 2 }, 'newerVersion')
    })

    const withData = async (change: (data: Record<string, any[]>) => void) => {
      const file = await valid()
      change(file.data)
      return file
    }

    it('when a record is malformed', async () => {
      await expectRejected(await withData((d) => { delete d.rounds }), 'invalid')
      await expectRejected(await withData((d) => { d.courses[0].name = '' }), 'invalid')
      await expectRejected(await withData((d) => { d.players.push({ id: 7, name: 'X' }) }), 'invalid')
      await expectRejected(await withData((d) => { d.layouts[0].pars = [3, 0] }), 'invalid')
      await expectRejected(await withData((d) => { d.layouts[0].lengths = [60] }), 'invalid')
      await expectRejected(await withData((d) => { d.rounds[0].scores = { p1: [3, 'x'] } }), 'invalid')
    })

    it('when a round has more scores than its layout has holes', async () => {
      await expectRejected(await withData((d) => { d.rounds[0].scores.p1 = [3, 3, 3] }), 'invalid')
    })

    it('when an id appears twice in one kind', async () => {
      await expectRejected(await withData((d) => { d.players.push({ id: 'p1', name: 'Again' }) }), 'invalid')
    })

    it('when it holds an unfinished round', async () => {
      await expectRejected(await withData((d) => { d.rounds[0].finished = false }), 'invalid')
    })

    it('when a reference exists neither in the file nor on the device', async () => {
      await expectRejected(await withData((d) => { d.layouts[0].courseId = 'nowhere' }), 'invalid')
      await expectRejected(await withData((d) => { d.rounds[0].layoutId = 'nowhere' }), 'invalid')
      await expectRejected(await withData((d) => { d.rounds[0].playerIds.push('nobody') }), 'invalid')
      await expectRejected(await withData((d) => { d.rounds[0].scores.nobody = [3, 3] }), 'invalid')
    })
  })
  it('accepts a reference that exists only on the device', async () => {
    const target = createMemoryStorage()
    await target.save('courses', { id: 'local', name: 'Local course' })
    const file = {
      format: 'discgolf-backup', version: 1, exportedAt: NOW.toISOString(),
      data: { courses: [], layouts: [{ id: 'l9', courseId: 'local', name: 'Main', pars: [3] }], players: [], rounds: [] },
    }

    await restoreBackup(target, file)

    expect(await target.get('layouts', 'l9')).toMatchObject({ courseId: 'local' })
  })

  it('stores missing hole lengths as empty, not null', async () => {
    const target = createMemoryStorage()
    const file = JSON.parse(JSON.stringify(await createBackup(await seeded(), NOW)))
    await restoreBackup(target, file)
    expect((await target.get('layouts', 'l1'))?.lengths).toEqual([60, undefined])
  })
})

describe('restoreBackup gap fill on existing ids', () => {
  const fileWith = (data: Partial<Record<'courses' | 'layouts' | 'players' | 'rounds', unknown[]>>) => ({
    format: 'discgolf-backup', version: 1, exportedAt: NOW.toISOString(),
    data: { courses: [], layouts: [], players: [], rounds: [], ...data },
  })

  it('fills an empty course location and keeps a local one', async () => {
    const target = createMemoryStorage()
    await target.save('courses', { id: 'c1', name: 'Local name' })
    await target.save('courses', { id: 'c2', name: 'Two', location: 'Espoo' })

    const result = await restoreBackup(target, fileWith({
      courses: [{ id: 'c1', name: 'Backup name', location: 'Helsinki' }, { id: 'c2', name: 'Two', location: 'Vantaa' }],
    }))

    expect(await target.get('courses', 'c1')).toEqual({ id: 'c1', name: 'Local name', location: 'Helsinki' })
    expect(await target.get('courses', 'c2')).toEqual({ id: 'c2', name: 'Two', location: 'Espoo' })
    expect(result.courses).toEqual({ added: 0, updated: 1, skipped: 1 })
  })
  it('fills empty hole lengths when hole counts match, never pars', async () => {
    const target = createMemoryStorage()
    await target.save('courses', { id: 'c1', name: 'Course' })
    await target.save('layouts', { id: 'l1', courseId: 'c1', name: 'Main', pars: [3, 3, 3], lengths: [50, undefined, undefined] })
    await target.save('layouts', { id: 'l2', courseId: 'c1', name: 'Other', pars: [3, 3] })

    const result = await restoreBackup(target, fileWith({
      layouts: [
        { id: 'l1', courseId: 'c1', name: 'Main', pars: [4, 4, 4], lengths: [99, 70, null] },
        { id: 'l2', courseId: 'c1', name: 'Other', pars: [3, 3, 3], lengths: [1, 2, 3] },
      ],
    }))

    expect(await target.get('layouts', 'l1')).toEqual(
      { id: 'l1', courseId: 'c1', name: 'Main', pars: [3, 3, 3], lengths: [50, 70, undefined] })
    expect(await target.get('layouts', 'l2')).toEqual({ id: 'l2', courseId: 'c1', name: 'Other', pars: [3, 3] })
    expect(result.layouts).toEqual({ added: 0, updated: 1, skipped: 1 })
  })
  async function withRoundRefs() {
    const target = createMemoryStorage()
    await target.save('courses', { id: 'c1', name: 'Course' })
    await target.save('layouts', { id: 'l1', courseId: 'c1', name: 'Main', pars: [3, 3, 3] })
    await target.save('layouts', { id: 'l2', courseId: 'c1', name: 'Other', pars: [3, 3, 3] })
    for (const id of ['p1', 'p2', 'p3']) await target.save('players', { id, name: id })
    return target
  }

  it('fills a missing round note and date, keeping local ones', async () => {
    const target = await withRoundRefs()
    await target.save('rounds', { id: 'r1', layoutId: 'l1', finished: true })
    await target.save('rounds', { id: 'r2', layoutId: 'l1', date: '2026-11-02', note: 'Local', finished: true })

    await restoreBackup(target, fileWith({
      rounds: [
        { id: 'r1', layoutId: 'l1', date: '2026-11-01', note: 'Windy', finished: true },
        { id: 'r2', layoutId: 'l1', date: '2026-01-01', note: 'Backup', finished: true },
      ],
    }))

    expect(await target.get('rounds', 'r1')).toMatchObject({ date: '2026-11-01', note: 'Windy' })
    expect(await target.get('rounds', 'r2')).toMatchObject({ date: '2026-11-02', note: 'Local' })
  })

  it('fills missing hole scores on the same layout for shared players only, never adding players', async () => {
    const target = await withRoundRefs()
    await target.save('rounds', {
      id: 'r1', layoutId: 'l1', playerIds: ['p1', 'p2'], finished: true,
      scores: { p1: [3, undefined, undefined], p2: [4, 4, 4] },
    })

    const result = await restoreBackup(target, fileWith({
      rounds: [{
        id: 'r1', layoutId: 'l1', playerIds: ['p1', 'p2', 'p3'], finished: true,
        scores: { p1: [5, 2, null], p2: [1, 1, 1], p3: [3, 3, 3] },
      }],
    }))

    expect(await target.get('rounds', 'r1')).toEqual({
      id: 'r1', layoutId: 'l1', playerIds: ['p1', 'p2'], finished: true,
      scores: { p1: [3, 2, undefined], p2: [4, 4, 4] },
    })
    expect(result.rounds).toEqual({ added: 0, updated: 1, skipped: 0 })
  })

  it('fills scores for a shared player with no local scores yet', async () => {
    const target = await withRoundRefs()
    await target.save('rounds', { id: 'r1', layoutId: 'l1', playerIds: ['p1'], finished: true })

    await restoreBackup(target, fileWith({
      rounds: [{ id: 'r1', layoutId: 'l1', playerIds: ['p1'], finished: true, scores: { p1: [3, 3, 3] } }],
    }))

    expect((await target.get('rounds', 'r1'))?.scores).toEqual({ p1: [3, 3, 3] })
  })

  it('leaves scores alone when the layout differs', async () => {
    const target = await withRoundRefs()
    await target.save('rounds', { id: 'r1', layoutId: 'l1', playerIds: ['p1'], finished: true, scores: { p1: [3, undefined, 3] } })

    const result = await restoreBackup(target, fileWith({
      rounds: [{ id: 'r1', layoutId: 'l2', playerIds: ['p1'], finished: true, scores: { p1: [3, 3, 3] } }],
    }))

    expect((await target.get('rounds', 'r1'))?.scores).toEqual({ p1: [3, undefined, 3] })
    expect(result.rounds).toEqual({ added: 0, updated: 0, skipped: 1 })
  })
  it('leaves archived records, layouts of archived courses and the Active Round alone', async () => {
    const target = await withRoundRefs()
    await target.save('courses', { id: 'old', name: 'Old', archived: true })
    await target.save('layouts', { id: 'lo', courseId: 'old', name: 'Main', pars: [3] })
    await target.save('layouts', { id: 'la', courseId: 'c1', name: 'Gone', pars: [3], archived: true })
    await target.save('rounds', { id: 'active', layoutId: 'l1', playerIds: ['p1'], scores: { p1: [3] } })

    const result = await restoreBackup(target, fileWith({
      courses: [{ id: 'old', name: 'Old', location: 'Turku' }],
      layouts: [
        { id: 'lo', courseId: 'old', name: 'Main', pars: [3], lengths: [80] },
        { id: 'la', courseId: 'c1', name: 'Gone', pars: [3], lengths: [80] },
      ],
      rounds: [{ id: 'active', layoutId: 'l1', playerIds: ['p1'], finished: true, note: 'Done', scores: { p1: [3, 3, 3] } }],
    }))

    expect(await target.get('courses', 'old')).toEqual({ id: 'old', name: 'Old', archived: true })
    expect(await target.get('layouts', 'lo')).toEqual({ id: 'lo', courseId: 'old', name: 'Main', pars: [3] })
    expect(await target.get('layouts', 'la')).toEqual({ id: 'la', courseId: 'c1', name: 'Gone', pars: [3], archived: true })
    expect(await target.get('rounds', 'active')).toEqual({ id: 'active', layoutId: 'l1', playerIds: ['p1'], scores: { p1: [3] } })
    expect(result).toMatchObject({
      courses: { updated: 0, skipped: 1 }, layouts: { updated: 0, skipped: 2 }, rounds: { updated: 0, skipped: 1 },
    })
  })
  it('reports nothing updated when the same file is restored again after filling', async () => {
    const target = await withRoundRefs()
    await target.save('rounds', { id: 'r1', layoutId: 'l1', playerIds: ['p1'], finished: true, scores: { p1: [3, undefined, 3] } })
    const file = fileWith({
      rounds: [{ id: 'r1', layoutId: 'l1', playerIds: ['p1'], finished: true, note: 'Windy', scores: { p1: [3, 4, 3] } }],
      layouts: [{ id: 'l1', courseId: 'c1', name: 'Main', pars: [3, 3, 3], lengths: [50, 60, 70] }],
    })
    await restoreBackup(target, file)

    const again = await restoreBackup(target, file)

    expect(again.rounds).toEqual({ added: 0, updated: 0, skipped: 1 })
    expect(again.layouts).toEqual({ added: 0, updated: 0, skipped: 1 })
  })
  it('leaves scores alone when neither round has a layout', async () => {
    const target = await withRoundRefs()
    await target.save('rounds', { id: 'r1', playerIds: ['p1'], finished: true, scores: { p1: [3, undefined] } })

    await restoreBackup(target, fileWith({
      rounds: [{ id: 'r1', playerIds: ['p1'], finished: true, scores: { p1: [3, 3] } }],
    }))

    expect((await target.get('rounds', 'r1'))?.scores).toEqual({ p1: [3, undefined] })
  })

  it('does not fill scores for a player missing from the backup round', async () => {
    const target = await withRoundRefs()
    await target.save('rounds', { id: 'r1', layoutId: 'l1', playerIds: ['p1', 'p2'], finished: true, scores: { p2: [3, undefined, 3] } })

    await restoreBackup(target, fileWith({
      rounds: [{ id: 'r1', layoutId: 'l1', playerIds: ['p1'], finished: true, scores: { p1: [3, 3, 3], p2: [3, 3, 3] } }],
    }))

    expect((await target.get('rounds', 'r1'))?.scores).toEqual({ p1: [3, 3, 3], p2: [3, undefined, 3] })
  })
})
