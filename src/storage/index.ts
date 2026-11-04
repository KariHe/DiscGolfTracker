import { createIndexedDbStorage } from './indexed-db.ts'
import { createMemoryStorage } from './memory.ts'
import type { Storage } from './port.ts'

/**
 * Backend selection, env-driven (ADR-0001). Nothing outside this file
 * imports a concrete adapter.
 */
const backends: Record<string, () => Storage> = {
  'indexed-db': () => createIndexedDbStorage(),
  memory: () => createMemoryStorage(),
}

export function createStorageFromEnv(env?: { VITE_STORAGE_BACKEND?: string }): Storage {
  const selected = env?.VITE_STORAGE_BACKEND ?? import.meta.env.VITE_STORAGE_BACKEND ?? 'indexed-db'
  const factory = backends[selected]
  if (!factory) throw new Error(`unknown VITE_STORAGE_BACKEND: ${selected}`)
  return factory()
}
