/**
 * IndexedDB adapter of the storage port (ADR-0001).
 * One object store per kind with keyPath "id"; same semantics as memory.js:
 * save.assigns an id when absent, get/list/delete per kind, and at most one
 * unfinished round (the Active Round, port rule).
 */
const KINDS = ['courses', 'layouts', 'players', 'rounds']

const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)

function openDb(dbName = 'discgolf') {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1)
    request.onupgradeneeded = () => {
      for (const kind of KINDS) {
        if (!request.result.objectStoreNames.contains(kind)) {
          request.result.createObjectStore(kind, { keyPath: 'id' })
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function awaitRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function createIndexedDbStorage({ dbName } = {}) {
  let dbPromise = null
  const db = () => {
    if (!dbPromise) dbPromise = openDb(dbName)
    return dbPromise
  }

  async function withStore(kind, mode, operation) {
    const database = await db()
    const transaction = database.transaction(kind, mode)
    const result = await operation(transaction.objectStore(kind), transaction)
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(result)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  }

  return {
    async save(kind, record) {
      return withStore(kind, 'readwrite', async (store) => {
        if (kind === 'rounds' && record.finished !== true) {
          const all = await awaitRequest(store.getAll())
          const active = all.find((other) => other.finished !== true && other.id !== record.id)
          if (active) throw new Error(`active round already exists (${active.id})`)
        }
        const saved = record.id ? { ...record } : { ...record, id: uuid() }
        await awaitRequest(store.put(saved))
        return saved
      })
    },
    async list(kind) {
      return withStore(kind, 'readonly', async (store) => await awaitRequest(store.getAll()))
    },
    async get(kind, id) {
      return withStore(kind, 'readonly', async (store) => await awaitRequest(store.get(id)))
    },
    async delete(kind, id) {
      return withStore(kind, 'readwrite', async (store) => {
        await awaitRequest(store.delete(id))
      })
    },
  }
}
