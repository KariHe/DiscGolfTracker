const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)

/** In-memory adapter of the storage port; used by tests and as a dev/demo backend. */
export function createMemoryStorage() {
  const store = new Map()
  return {
    async save(kind, record) {
      if (!store.has(kind)) store.set(kind, new Map())
      const kindStore = store.get(kind)
      if (kind === 'rounds' && record.finished !== true) {
        for (const other of kindStore.values()) {
          if (other.finished !== true && other.id !== record.id) {
            throw new Error(`active round already exists (${other.id})`)
          }
        }
      }
      const saved = record.id
        ? { ...record }
        : { ...record, id: uuid() }
      kindStore.set(saved.id, saved)
      return saved
    },
    async list(kind) {
      return store.has(kind) ? Array.from(store.get(kind).values()) : []
    },
    async get(kind, id) {
      return store.get(kind)?.get(id)
    },
    async delete(kind, id) {
      store.get(kind)?.delete(id)
    },
  }
}
