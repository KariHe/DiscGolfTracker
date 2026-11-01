import { createIndexedDbStorage } from './indexed-db.js'
import { createMemoryStorage } from './memory.js'

/**
 * Backend selection, env-driven (ADR-0001). Nothing outside this file
 * imports a concrete adapter.
 */
const backends = {
  'indexed-db': createIndexedDbStorage,
  memory: createMemoryStorage,
}

export function createStorageFromEnv(env = import.meta.env) {
  const selected = env.VITE_STORAGE_BACKEND ?? 'indexed-db'
  const factory = backends[selected]
  if (!factory) throw new Error(`unknown VITE_STORAGE_BACKEND: ${selected}`)
  return factory()
}
