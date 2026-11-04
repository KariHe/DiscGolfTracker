import type { RecordOf, Round } from '../domain/types.ts'
import type { Storage } from './port.ts'

/**
 * IndexedDB adapter of the storage port (ADR-0001).
 * One object store per kind with keyPath "id"; same semantics as memory.ts:
 * save assigns an id when absent, get/list/delete per kind, and at most one
 * unfinished round (the Active Round, port rule).
 */
const KINDS = ['courses', 'layouts', 'players', 'rounds'] as const

const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)

function openDb(dbName: string = 'discgolf') {
  return new Promise<IDBDatabase>((resolve, reject) => {
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

function awaitRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function createIndexedDbStorage({ dbName }: { dbName?: string } = {}): Storage {
  let dbPromise: Promise<IDBDatabase> | null = null
  const db = () => {
    if (!dbPromise) dbPromise = openDb(dbName)
    return dbPromise
  }

  async function withStore<R>(
    kind: keyof RecordOf,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore, transaction: IDBTransaction) => R,
  ): Promise<R> {
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
        if (kind === 'rounds' && (record as Partial<Round>).finished !== true) {
          const all = await awaitRequest(store.getAll())
          const active = all.find(
            (other) => (other as Partial<Round>).finished !== true && (other as { id?: string }).id !== record.id,
          )
          if (active) throw new Error(`active round already exists (${(active as { id: string }).id})`)
        }
        const saved = (record.id
          ? { ...record }
          : { ...record, id: uuid() }) as unknown as RecordOf[typeof kind]
        await awaitRequest(store.put(saved))
        return saved
      })
    },
    async list(kind) {
      return withStore(kind, 'readonly', async (store) =>
        (await awaitRequest(store.getAll())) as RecordOf[typeof kind][],
      )
    },
    async get(kind, id) {
      return withStore(kind, 'readonly', async (store) =>
        (await awaitRequest(store.get(id))) as RecordOf[typeof kind] | undefined,
      )
    },
    async delete(kind, id) {
      return withStore(kind, 'readwrite', async (store) => {
        await awaitRequest(store.delete(id))
      })
    },
  }
}
