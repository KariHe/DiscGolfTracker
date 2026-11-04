/**
 * Storage port. The app's only persistence contract (ADR-0001).
 * Backends implement every method below; nothing else may be used by the app.
 *
 * Collection kinds: "courses", "layouts", "players", "rounds".
 * Records are plain objects; ids are opaque strings assigned by the backend.
 * Rule: at most one unfinished round (the Active Round). SAVING a second
 * unfinished round (different id) rejects.
 */
import type { RecordOf } from '../domain/types.ts'

/**
 * Storage port. The app's only persistence contract (ADR-0001).
 * Backends implement every method below; nothing else may be used by the app.
 *
 * Collection kinds: "courses", "layouts", "players", "rounds".
 * Records are plain objects; ids are opaque strings assigned by the backend.
 * Rule: at most one unfinished round (the Active Round). SAVING a second
 * unfinished round (different id) rejects.
 */
export interface Storage {
  save<K extends keyof RecordOf>(kind: K, record: Partial<RecordOf[K]>): Promise<RecordOf[K]>
  list<K extends keyof RecordOf>(kind: K): Promise<RecordOf[K][]>
  get<K extends keyof RecordOf>(kind: K, id: string): Promise<RecordOf[K] | undefined>
  delete(kind: keyof RecordOf, id: string): Promise<void>
}

export function createStorage(createBackend: () => Storage): Storage {
  return createBackend()
}

/**
 * Shared conformance suite. Each adapter test file passes a factory that
 * yields a storage preloaded with nothing more.
 */
export function runPortConformanceSuite(name: string, makeStorage: () => Promise<Storage>) {
  const round = (id: string, { finished = false } = {}): Partial<RecordOf['rounds']> => ({ id, date: '2026-11-01', finished })

  describe(`storage port: ${name}`, () => {
    let storage: Storage
    beforeEach(async () => {
      storage = await makeStorage()
    })

    it('saves and lists records per kind', async () => {
      await storage.save('courses', { name: 'Meikäläinen' })
      await storage.save('courses', { name: 'Anders Ritual' })
      const all = await storage.list('courses')
      expect(all).toHaveLength(2)
      expect(all.map((c) => c.name).sort()).toEqual(['Anders Ritual', 'Meikäläinen'])
      for (const course of all) expect(typeof course.id).toBe('string')
    })

    it('updates a record on save with an existing id', async () => {
      const saved = await storage.save('players', { name: 'Kari' })
      await storage.save('players', { ...saved, name: 'Kari H.' })
      const all = await storage.list('players')
      expect(all).toHaveLength(1)
      expect(all[0].name).toBe('Kari H.')
    })

    it('gets and deletes by id', async () => {
      const saved = await storage.save('players', { name: 'Nadja' })
      expect((await storage.get('players', saved.id))?.name).toBe('Nadja')
      await storage.delete('players', saved.id)
      expect(await storage.get('players', saved.id)).toBeUndefined()
      expect(await storage.list('players')).toHaveLength(0)
    })

    it('allows saving a record without an id and assigns one', async () => {
      const saved = await storage.save('courses', { name: 'Kustaankartano' })
      expect(saved.id).toBeTruthy()
    })

    it('enforces one Active Round', async () => {
      const active = await storage.save('rounds', round('r1'))
      await expect(storage.save('rounds', round('r2'))).rejects.toThrow()
      await expect(storage.save('rounds', round('r2'))).rejects.toThrow()
      // finishing the Active Round unblocks the next one
      await storage.save('rounds', { ...active, finished: true })
      await expect(storage.save('rounds', round('r3', { finished: true }))).resolves.toBeTruthy()
    })
  })
}
