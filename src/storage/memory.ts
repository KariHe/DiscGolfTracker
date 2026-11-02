import type { Kind, RecordOf, Round } from '../domain/types.ts'
import type { Storage } from './port.ts'

const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)

/** In-memory adapter of the storage port; used by tests and as a dev/demo backend. */
export function createMemoryStorage(): Storage {
  const store = new Map<Kind, Map<string, unknown>>()
  return {
    async save(kind, record) {
      if (!store.has(kind)) store.set(kind, new Map())
      const kindStore = store.get(kind)!
      if (kind === 'rounds' && (record as Partial<Round>).finished !== true) {
        for (const other of kindStore.values() as MapIterator<Round>) {
          if (other.finished !== true && other.id !== record.id) {
            throw new Error(`active round already exists (${other.id})`)
          }
        }
      }
      const saved = (record.id ? { ...record } : { ...record, id: uuid() }) as RecordOf[Kind]
      kindStore.set(saved.id, saved)
      return saved as never
    },
    async list(kind) {
      const kindStore = store.get(kind)
      return (kindStore ? Array.from(kindStore.values()) : []) as never
    },
    async get(kind, id) {
      return store.get(kind)?.get(id) as never
    },
    async delete(kind, id) {
      store.get(kind)?.delete(id)
    },
  }
}
