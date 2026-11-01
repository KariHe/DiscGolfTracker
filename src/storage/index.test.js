import { describe, expect, it } from 'vitest'
import { createStorageFromEnv } from './index.js'

describe('createStorageFromEnv', () => {
  it('returns a ready storage adapter for the default backend, not a promise', () => {
    const storage = createStorageFromEnv({})
    expect(typeof storage.list).toBe('function')
    expect(typeof storage.save).toBe('function')
    expect(typeof storage.get).toBe('function')
    expect(typeof storage.delete).toBe('function')
  })

  it('selects the memory backend when VITE_STORAGE_BACKEND=memory', async () => {
    const storage = createStorageFromEnv({ VITE_STORAGE_BACKEND: 'memory' })
    await storage.save('players', { name: 'Kari' })
    expect(await storage.list('players')).toHaveLength(1)
  })

  it('selects the indexed-db backend by name', () => {
    const storage = createStorageFromEnv({ VITE_STORAGE_BACKEND: 'indexed-db' })
    expect(typeof storage.list).toBe('function')
  })
})
